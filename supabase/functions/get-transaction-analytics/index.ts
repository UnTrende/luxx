import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { validateAuth } from '../_shared/auth.ts';
import type { TransactionAnalytics } from '../_shared/types.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') return handleCors(req);

    try {
        // Validate admin authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return createErrorResponse('Missing authorization header', 401);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const user = await validateAuth(supabase, ['admin']);
        if (!user) {
            return createErrorResponse('Unauthorized: Admin access required', 403);
        }

        // Parse query parameters
        const url = new URL(req.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const groupBy = url.searchParams.get('groupBy') || 'day';

        // Default to last 30 days if no dates provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Fetch transactions within date range
        let query = supabase
            .from('transactions')
            .select('*')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: true });

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error, 'index');
            return createErrorResponse(`Failed to fetch transactions: ${error.message}`, 500);
        }

        // Calculate daily breakdown
        const dailyMap = new Map<string, {
            bookings: { count: number; revenue: number };
            walkIns: { count: number; revenue: number };
            total: { count: number; revenue: number };
        }>();

        transactions.forEach(txn => {
            const date = new Date(txn.created_at).toISOString().split('T')[0];

            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    bookings: { count: 0, revenue: 0 },
                    walkIns: { count: 0, revenue: 0 },
                    total: { count: 0, revenue: 0 },
                });
            }

            const daily = dailyMap.get(date)!;
            daily.total.count++;
            daily.total.revenue += txn.total_amount;

            if (txn.customer_type === 'booking') {
                daily.bookings.count++;
                daily.bookings.revenue += txn.total_amount;
            } else {
                daily.walkIns.count++;
                daily.walkIns.revenue += txn.total_amount;
            }
        });

        const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            ...data,
        }));

        // Calculate frequent walk-ins
        const walkInMap = new Map<string, {
            customer_name: string;
            customer_phone: string;
            visit_count: number;
            total_spent: number;
        }>();

        transactions
            .filter(txn => txn.customer_type === 'walk-in')
            .forEach(txn => {
                const key = txn.customer_phone;

                if (!walkInMap.has(key)) {
                    walkInMap.set(key, {
                        customer_name: txn.customer_name,
                        customer_phone: txn.customer_phone,
                        visit_count: 0,
                        total_spent: 0,
                    });
                }

                const customer = walkInMap.get(key)!;
                customer.visit_count++;
                customer.total_spent += txn.total_amount;
            });

        const frequentWalkIns = Array.from(walkInMap.values())
            .sort((a, b) => b.visit_count - a.visit_count)
            .slice(0, 5);

        // Calculate payment method distribution
        const paymentMethods = {
            cash: 0,
            card: 0,
            mobile: 0,
        };

        transactions.forEach(txn => {
            if (txn.payment_method in paymentMethods) {
                paymentMethods[txn.payment_method as keyof typeof paymentMethods] += txn.total_amount;
            }
        });

        // For single day request, return just that day's data
        const breakdown = dailyBreakdown.length > 0 ? dailyBreakdown[0] : {
            date: start.toISOString().split('T')[0],
            bookings: { count: 0, revenue: 0 },
            walkIns: { count: 0, revenue: 0 },
            total: { count: 0, revenue: 0 },
        };

        // Add last_visit to frequent walk-ins
        const walkInsWithLastVisit = frequentWalkIns.map(customer => {
            const lastTxn = transactions
                .filter(t => t.customer_phone === customer.customer_phone && t.customer_type === 'walk-in')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
            return {
                ...customer,
                last_visit: lastTxn?.created_at || new Date().toISOString()
            };
        });

        const analytics = {
            breakdown,
            frequentWalkIns: walkInsWithLastVisit,
            paymentMethods,
            dailyBreakdown, // Keep for historical data
        };

        return createSuccessResponse(analytics);
    } catch (error) {
        console.error('Unexpected error:', error, 'index');
        return createErrorResponse(`Internal server error: ${error.message}`, 500);
    }
});
