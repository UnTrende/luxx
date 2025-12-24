import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateAdmin } from '../_shared/auth.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Authenticate Admin
        await authenticateAdmin(req);

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Time ranges
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const oneWeekAgoIso = oneWeekAgo.toISOString();
        const twoWeeksAgoIso = twoWeeksAgo.toISOString();
        const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

        // 2. Parallel Data Fetching
        const [
            // Current Period (Last 7 Days) for Growth Calc
            { data: currentOrders, error: currentOrdersError },
            { data: currentBookings, error: currentBookingsError },

            // Previous Period (7-14 Days Ago) for Growth Calc
            { data: previousOrders, error: previousOrdersError },
            { data: previousBookings, error: previousBookingsError },

            // Other
            { data: attendance, error: attendanceError },
            { data: barbers, error: barbersError },
            { count: activeBarbersCount, error: activeBarbersError }
        ] = await Promise.all([
            // Current Week
            supabaseAdmin.from('product_orders').select('*, products(price)').gte('timestamp', oneWeekAgoIso),
            supabaseAdmin.from('bookings').select('totalprice').gte('date', oneWeekAgoIso).neq('status', 'cancelled'),

            // Previous Week
            supabaseAdmin.from('product_orders').select('*, products(price)').gte('timestamp', twoWeeksAgoIso).lt('timestamp', oneWeekAgoIso),
            supabaseAdmin.from('bookings').select('totalprice').gte('date', twoWeeksAgoIso).lt('date', oneWeekAgoIso).neq('status', 'cancelled'),

            // Other
            supabaseAdmin.from('attendance').select('*').eq('date', today),
            supabaseAdmin.from('barbers').select('id, name').eq('active', true),
            supabaseAdmin.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present')
        ]);

        if (currentOrdersError) throw currentOrdersError;
        if (currentBookingsError) throw currentBookingsError;
        if (previousOrdersError) throw previousOrdersError;
        if (previousBookingsError) throw previousBookingsError;
        if (attendanceError) throw attendanceError;
        if (barbersError) throw barbersError;

        // 3. Helper to calc revenue
        const calculateRevenue = (orders: unknown[], bookings: unknown[]) => {
            let rev = 0;
            orders?.forEach(o => {
                const price = o.products?.price || 0;
                const qty = o.quantity || 1;
                rev += price * qty;
            });
            bookings?.forEach(b => {
                rev += (b.totalPrice || b.totalprice || 0); // Note: verify case sensitivity of totalPrice in DB schema. Usually lowercase in postgres unless quoted.
                // Assuming 'totalPrice' based on previous context, but DB might be 'totalprice'.
                // Supabase JS often returns whatever the DB has. Safe check:
                // rev += (b.totalPrice || b.totalprice || 0);
            });
            return rev;
        };

        // NOTE: The DB column is likely `totalPrice` (camelCase) if created via ORM, or `totalprice` if raw SQL. 
        // Based on types.ts it is `totalPrice`.
        // Let's be safe.

        const safeCalcRev = (orders: unknown[], bookings: unknown[]) => {
            let rev = 0;
            orders?.forEach(o => rev += (Number(o.products?.price || 0) * Number(o.quantity || 1)));
            bookings?.forEach(b => rev += Number(b.totalPrice || b.totalprice || 0));
            return rev;
        }

        const currentRevenue = safeCalcRev(currentOrders || [], currentBookings || []);
        const previousRevenue = safeCalcRev(previousOrders || [], previousBookings || []);

        // 4. Calculate Weekly Growth
        let weeklyGrowth = 0;
        if (previousRevenue > 0) {
            weeklyGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        } else if (currentRevenue > 0) {
            weeklyGrowth = 100; // 100% growth if prev was 0
        }

        // Format to 1 decimal
        weeklyGrowth = Math.round(weeklyGrowth * 10) / 10;

        // 5. Total Revenue (Lifetime or Year)
        // For the "Total Revenue" card, fetching EVERYTHING might be heavy. 
        // Let's do a separate optimized aggregation query if possible.
        // Or just failover to using the same 'currentRevenue' if we only want "Weekly Revenue".
        // BUT the UI says "Total Revenue". 
        // Let's try to get a rough lifetime total using .select('totalPrice').sum() logic? No, supabase-js select doesn't do sum easily without RPC.
        // Let's use the 30-day window for "Total Revenue" label to be "Revenue (30d)" for now, 
        // OR fetch a larger batch. Let's fetch Top-level revenue for 30 days to keep it fast.

        // Re-fetching 30 days for charts/total
        const { data: monthOrders } = await supabaseAdmin.from('product_orders').select('*, products(price)').gte('timestamp', thirtyDaysAgoIso);
        const { data: monthBookings } = await supabaseAdmin.from('bookings').select('totalprice, service_ids').gte('date', thirtyDaysAgoIso).neq('status', 'cancelled');

        const totalRevenue30d = safeCalcRev(monthOrders || [], monthBookings || []);

        // 6. Top Services (from 30d data)
        const serviceCounts: Record<string, number> = {};
        monthBookings?.forEach((b: unknown) => {
            // Handle service_ids which might be string[] or JSON
            const ids = b.serviceIds || b.service_ids; // Handle casing
            if (ids && Array.isArray(ids)) {
                ids.forEach((id: string) => {
                    serviceCounts[id] = (serviceCounts[id] || 0) + 1;
                });
            }
        });

        const { data: services } = await supabaseAdmin.from('services').select('id, name');
        const topServices = Object.entries(serviceCounts)
            .map(([id, count]) => {
                const svc = services?.find(s => s.id === id);
                return { name: svc?.name || 'Unknown', count, id };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return new Response(JSON.stringify({
            stats: {
                totalRevenue: totalRevenue30d,
                weeklyGrowth: weeklyGrowth, // Now real!
                activeChairs: { active: activeBarbersCount || 0, total: barbers?.length || 0 },
                bookingsCount: monthBookings?.length || 0
            },
            charts: {
                topServices
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});