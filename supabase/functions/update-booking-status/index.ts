import { logger } from '../_shared/response.ts';

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
            },
        });
    }

    try {
        const { bookingId, newStatus } = await req.json();

        console.log('📋 Update booking status request:', { bookingId, newStatus, bookingIdType: typeof bookingId }, 'index');

        if (!bookingId || !newStatus) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Create client for authentication check
        const supabaseAuth = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // Verify admin role
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin';

        if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Use service role client for database operations (bypasses RLS)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log('📋 Using service role client for database operations', undefined, 'index');

        // First, check if the booking exists
        const { data: existingBooking, error: checkError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        console.log('Checking existing booking', { 
      bookingId, 
      currentStatus: existingBooking?.status 
    }, 'update-booking-status');

        // Also check all bookings to see if ID exists with different format
        const { data: allBookings, error: allError } = await supabase
            .from('bookings')
            .select('id')
            .limit(20);
        
        console.log('📋 Sample booking IDs in database:', allBookings?.map(b => b.id, 'index').slice(0, 5));
        console.log('📋 Looking for ID:', bookingId, 'index');
        console.log('📋 ID exists in list:', allBookings?.some(b => b.id === bookingId, 'index'));

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('📋 Error checking booking:', checkError, 'index');
            return new Response(JSON.stringify({ error: `Database error: ${checkError.message}` }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (!existingBooking) {
            console.error('📋 Booking not found with ID:', bookingId, 'index');
            return new Response(JSON.stringify({ 
                error: 'Booking not found',
                details: `No booking found with id: ${bookingId}` 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Now update the booking
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .select();

        console.log('📋 Update result:', { success: !!data, error: error?.message, updatedData: data }, 'index');

        if (error) {
            console.error('📋 Update error:', error, 'index');
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Check if any rows were updated
        if (!data || data.length === 0) {
            return new Response(JSON.stringify({ error: 'Booking not found or not updated' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        console.log('📋 Successfully updated booking:', data[0], 'index');

        const updatedBooking = data[0];
        let loyaltyResult = null;

        // If booking is marked as completed, handle loyalty logic
        if (newStatus === 'completed' && existingBooking.status !== 'completed') {
            console.log('🎁 Booking completed, processing loyalty...', undefined, 'index');
            
            try {
                // Check if this is a reward booking (paid with points)
                const isRewardBooking = updatedBooking.is_reward_booking || false;
                const pointsRedeemed = updatedBooking.points_redeemed || 0;

                console.log('🎁 Booking type:', isRewardBooking ? 'REWARD (paid with points, 'index')' : 'REGULAR (paid with money)');

                // Get the service IDs from the booking
                const serviceIds = updatedBooking.service_ids || [];
                const totalPrice = updatedBooking.totalprice || 0;
                
                if (serviceIds.length > 0 && updatedBooking.user_id) {
                    // Fetch user's current loyalty status
                    const { data: userProfile, error: profileError } = await supabase
                        .from('app_users')
                        .select('total_confirmed_visits, redeemable_points, status_tier')
                        .eq('id', updatedBooking.user_id)
                        .single();

                    if (profileError) {
                        console.error('🎁 Error fetching user profile:', profileError, 'index');
                        throw profileError;
                    }

                    // IF REWARD BOOKING: Deduct points (no points awarded)
                    if (isRewardBooking && pointsRedeemed > 0) {
                        console.log(`💎 REWARD BOOKING: Deducting ${pointsRedeemed} points from customer`, undefined, 'index');

                        const newPointsBalance = (userProfile.redeemable_points || 0) - pointsRedeemed;

                        if (newPointsBalance < 0) {
                            console.error('💎 ERROR: Customer does not have enough points!', undefined, 'index');
                            throw new Error('Insufficient points for redemption');
                        }

                        // Deduct points
                        const { data: updatedUser, error: updateError } = await supabase
                            .from('app_users')
                            .update({
                                redeemable_points: newPointsBalance,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', updatedBooking.user_id)
                            .select()
                            .single();

                        if (updateError) {
                            console.error('💎 Error deducting points:', updateError, 'index');
                            throw updateError;
                        }

                        console.log(`💎 Points deducted successfully. New balance: ${newPointsBalance}`, undefined, 'index');

                        // Record redemption transaction
                        await supabase
                            .from('loyalty_transactions')
                            .insert({
                                user_id: updatedBooking.user_id,
                                transaction_type: 'REDEEMED',
                                points_amount: -pointsRedeemed,
                                description: `Redeemed ${pointsRedeemed} points for free service`,
                                booking_id: bookingId
                            });

                        loyaltyResult = {
                            pointsRedeemed: pointsRedeemed,
                            newBalance: newPointsBalance,
                            isRewardBooking: true
                        };

                        console.log('💎 Reward redemption completed:', loyaltyResult, 'index');
                    }
                    // ELSE REGULAR BOOKING: Award points
                    else {
                        console.log('🎁 REGULAR BOOKING: Awarding loyalty points...', undefined, 'index');
                        // Fetch services with tier-specific loyalty points
                        const { data: services, error: serviceError } = await supabase
                            .from('services')
                            .select('id, name, loyalty_points_silver, loyalty_points_gold, loyalty_points_platinum')
                            .in('id', serviceIds);

                        if (serviceError) {
                            console.error('🎁 Error fetching services:', serviceError, 'index');
                        } else {
                            // Determine which tier field to use based on user's current tier
                            const userTier = userProfile.status_tier || 'Silver';
                            let pointsField: 'loyalty_points_silver' | 'loyalty_points_gold' | 'loyalty_points_platinum';
                            
                            if (userTier === 'Platinum') {
                                pointsField = 'loyalty_points_platinum';
                            } else if (userTier === 'Gold') {
                                pointsField = 'loyalty_points_gold';
                            } else {
                                pointsField = 'loyalty_points_silver';
                            }

                            console.log('🎁 User tier:', userTier, '| Points field:', pointsField, 'index');

                            // Sum up loyalty points from all services using the appropriate tier field
                            const pointsToAward = services.reduce((sum, s) => {
                                const points = s[pointsField] || 0;
                                console.log(`🎁 Service "${s.name}": ${points} points for ${userTier} tier`, undefined, 'index');
                                return sum + points;
                            }, 0);

                            console.log('🎁 Total points to award:', pointsToAward, 'index');

                            // Fetch loyalty settings for tier thresholds
                            const { data: settings, error: settingsError } = await supabase
                                .from('loyalty_settings')
                                .select('*')
                                .single();

                            if (settingsError) {
                                console.error('🎁 Error fetching loyalty settings:', settingsError, 'index');
                            } else {

                                // Increment visit count
                                const newVisitCount = (userProfile.total_confirmed_visits || 0) + 1;

                                // Determine new tier based on visit count
                                let newTier = userProfile.status_tier || 'Silver';
                                let tierUpgraded = false;
                                
                                if (newVisitCount >= (settings.gold_threshold || 10) && userProfile.status_tier === 'Silver') {
                                    newTier = 'Gold';
                                    tierUpgraded = true;
                                } else if (newVisitCount >= (settings.platinum_threshold || 25) && userProfile.status_tier === 'Gold') {
                                    newTier = 'Platinum';
                                    tierUpgraded = true;
                                }

                                // Update user's loyalty stats
                                const { data: updatedUser, error: updateError } = await supabase
                                    .from('app_users')
                                    .update({
                                        total_confirmed_visits: newVisitCount,
                                        redeemable_points: (userProfile.redeemable_points || 0) + pointsToAward,
                                        status_tier: newTier,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', updatedBooking.user_id)
                                    .select()
                                    .single();

                                if (updateError) {
                                    console.error('🎁 Error updating user loyalty stats:', updateError, 'index');
                                } else {
                                    console.log('🎁 User loyalty stats updated:', updatedUser, 'index');

                                    // Record the transaction
                                    await supabase
                                        .from('loyalty_transactions')
                                        .insert({
                                            user_id: updatedBooking.user_id,
                                            transaction_type: 'EARNED',
                                            points_amount: pointsToAward,
                                            description: `Earned ${pointsToAward} points for completing booking (${userTier} tier rewards)`,
                                            booking_id: bookingId
                                        });

                                    // If tier was upgraded, record that transaction too
                                    if (tierUpgraded) {
                                        await supabase
                                            .from('loyalty_transactions')
                                            .insert({
                                                user_id: updatedBooking.user_id,
                                                transaction_type: 'EARNED',
                                                points_amount: 0,
                                                description: `🎉 Congratulations! You've been upgraded to ${newTier} status after ${newVisitCount} visits!`,
                                                booking_id: bookingId
                                            });
                                    }

                                    loyaltyResult = {
                                        pointsAwarded: pointsToAward,
                                        newVisitCount,
                                        newTier,
                                        previousTier: userProfile.status_tier,
                                        tierUpgraded
                                    };

                                    console.log('🎁 Loyalty points awarded successfully:', loyaltyResult, 'index');
                                }
                            }
                        }
                    }
                }
            } catch (loyaltyError) {
                console.error('🎁 Error processing loyalty points:', loyaltyError, 'index');
                // Don't fail the booking update if loyalty processing fails
            }
        }

        // Return the first (and should be only) updated booking
        return new Response(JSON.stringify({ 
            success: true, 
            booking: updatedBooking,
            loyaltyResult 
        }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (err) {
        console.error('📋 Unexpected error:', err, 'index');
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
