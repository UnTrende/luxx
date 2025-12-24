import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { validateAuth } from '../_shared/auth.ts';
import type { CreateTransactionInput, Transaction, ServiceItem } from '../_shared/types.ts';

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

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
            return createErrorResponse('Unauthorized: Admin access required. Please ensure you are logged in as an admin.', 403);
        }

        // Parse request body
        const body: CreateTransactionInput = await req.json();
        const {
            customerName,
            customerPhone,
            customerId,
            customerType,
            services,
            barberId,
            bookingId,
            paymentMethod,
        } = body;

        // Validate required fields
        if (!customerName || !customerPhone || !customerType || !services || services.length === 0 || !paymentMethod) {
            return createErrorResponse('Missing required fields', 400);
        }

        if (!['walk-in', 'booking', 'order'].includes(customerType)) {
            return createErrorResponse('Invalid customer type', 400);
        }

        if (!['cash', 'card', 'mobile'].includes(paymentMethod)) {
            return createErrorResponse('Invalid payment method', 400);
        }

        // If email/phone is provided and no customerId, try to find matching user
        let finalCustomerId = customerId;
        if (!finalCustomerId && customerPhone) {
            // Try to match by email (customerPhone field actually contains email for registered users)
            const { data: matchingUser } = await supabase
                .from('app_users')
                .select('id')
                .eq('email', customerPhone)
                .single();

            if (matchingUser) {
                finalCustomerId = matchingUser.id;
            }
        }
        
        console.log('💳 Transaction - customerId:', customerId);
        console.log('💳 Transaction - finalCustomerId:', finalCustomerId);
        console.log('💳 Transaction - customerPhone:', customerPhone);

        // Fetch current tax rate from site_settings
        const { data: taxRateData } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'tax_rate')
            .single();

        const taxRate = taxRateData?.value ? parseFloat(taxRateData.value) : 10.00;

        // Calculate totals
        const subtotal = services.reduce((sum: number, service: ServiceItem) => sum + service.price, 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;

        // Round to 2 decimal places
        const roundedSubtotal = Math.round(subtotal * 100) / 100;
        const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
        const roundedTotalAmount = Math.round(totalAmount * 100) / 100;

        // Create transaction record
        const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .insert({
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_id: finalCustomerId,
                customer_type: customerType,
                services: services,
                subtotal: roundedSubtotal,
                tax_rate: taxRate,
                tax_amount: roundedTaxAmount,
                total_amount: roundedTotalAmount,
                payment_method: paymentMethod,
                barber_id: barberId,
                booking_id: bookingId,
                created_by: user.id,
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Transaction creation error:', transactionError, 'index');
            return createErrorResponse(`Failed to create transaction: ${transactionError.message}`, 500);
        }

        // If booking was provided, update it
        if (bookingId) {
            const { error: bookingUpdateError } = await supabase
                .from('bookings')
                .update({
                    transaction_id: transaction.id,
                    status: 'completed',
                })
                .eq('id', bookingId);

            if (bookingUpdateError) {
                console.error('Booking update error:', bookingUpdateError, 'index');
                // Don't fail the transaction, but log the error
            }

            // Award loyalty points if customer is registered
            if (finalCustomerId) {
                console.log('🎁 Awarding loyalty points for customer:', finalCustomerId);
                
                // Use service role to bypass RLS for loyalty updates
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                );
                
                // Get user data and tier
                const { data: userData, error: userError } = await supabaseAdmin
                    .from('app_users')
                    .select('status_tier, redeemable_points, total_confirmed_visits')
                    .eq('id', finalCustomerId)
                    .single();

                console.log('👤 User data:', userData);
                console.log('❌ User error:', userError);

                if (userData) {
                    // SERVICE-BASED POINTS SYSTEM
                    // Calculate points based on service-specific points for each tier
                    let totalPoints = 0;
                    
                    // Get all service IDs from the services array
                    const serviceIds = services
                        .map((s: ServiceItem) => s.service_id)
                        .filter(Boolean);
                    
                    if (serviceIds.length > 0) {
                        // Fetch service loyalty points from database
                        const { data: servicesData } = await supabaseAdmin
                            .from('services')
                            .select('id, name, loyalty_points_silver, loyalty_points_gold, loyalty_points_platinum')
                            .in('id', serviceIds);
                        
                        console.log('🎯 Services data:', servicesData);
                        
                        // Sum up points based on user's tier
                        if (servicesData) {
                            for (const service of servicesData) {
                                let servicePoints = 0;
                                if (userData.status_tier === 'Silver') {
                                    servicePoints = service.loyalty_points_silver || 0;
                                } else if (userData.status_tier === 'Gold') {
                                    servicePoints = service.loyalty_points_gold || 0;
                                } else if (userData.status_tier === 'Platinum') {
                                    servicePoints = service.loyalty_points_platinum || 0;
                                }
                                totalPoints += servicePoints;
                            }
                        }
                    }

                    console.log('💰 Points calculation:', {
                        tier: userData.status_tier,
                        servicesCount: serviceIds.length,
                        pointsEarned: totalPoints
                    });

                    // Only proceed if we have valid points
                    if (totalPoints > 0) {
                        // Update user's loyalty stats (using service role to bypass RLS)
                        const { error: updateError } = await supabaseAdmin
                            .from('app_users')
                            .update({
                                redeemable_points: (userData.redeemable_points || 0) + totalPoints,
                                total_confirmed_visits: (userData.total_confirmed_visits || 0) + 1,
                            })
                            .eq('id', finalCustomerId);

                        console.log('✅ Updated loyalty points, error:', updateError);

                        // Create loyalty transaction record (using service role)
                        const { error: transactionError } = await supabaseAdmin
                            .from('loyalty_transactions')
                            .insert({
                                user_id: finalCustomerId,
                                transaction_type: 'EARNED',
                                points_amount: totalPoints,
                                description: `Earned ${totalPoints} points from ${serviceIds.length} service(s)`,
                                booking_id: bookingId,
                            });
                        
                        console.log('✅ Created loyalty transaction, error:', transactionError);
                    } else {
                        console.log('⚠️ No loyalty points configured for these services');
                    }
                }
            }
        }

        // Fetch related data for receipt
        let barberName = null;
        if (barberId) {
            const { data: barberData } = await supabase
                .from('barbers')
                .select('name')
                .eq('id', barberId)
                .single();
            barberName = barberData?.name;
        }

        // Return transaction with receipt data
        const response: Transaction & { barber_name?: string } = {
            ...transaction,
            barber_name: barberName,
        };

        return createSuccessResponse(response);
    } catch (error) {
        console.error('Unexpected error:', error, 'index');
        return createErrorResponse(`Internal server error: ${error.message}`, 500);
    }
});
