// Edge function to process loyalty transactions when bookings are completed
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    // Parse request body
    const { bookingId, amountPaid, serviceId } = await req.json();

    if (!bookingId || !amountPaid || !serviceId) {
      throw new Error('Missing required parameters: bookingId, amountPaid, and serviceId');
    }

    // Fetch user's current loyalty status
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('app_users')
      .select('total_confirmed_visits, redeemable_points, status_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Fetch the service to get loyalty points
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('loyalty_points')
      .eq('id', serviceId)
      .single();

    if (serviceError) {
      throw serviceError;
    }

    // Fetch loyalty settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('loyalty_settings')
      .select('*')
      .single();

    if (settingsError) {
      throw settingsError;
    }

    // Get base points from service
    let basePoints = service.loyalty_points_bronze || service.loyalty_points_silver || service.loyalty_points_gold || 0 || 0;

    // Determine bonus multiplier based on user's tier
    let multiplier = 1.0;
    if (userProfile.status_tier === 'Gold') {
      multiplier = settings.service_rate_gold;
    } else if (userProfile.status_tier === 'Platinum') {
      multiplier = settings.service_rate_platinum;
    }

    // Calculate final points to award
    const pointsToAward = Math.floor(basePoints * multiplier);

    // Increment visit count
    const newVisitCount = userProfile.total_confirmed_visits + 1;

    // Determine new tier based on visit count
    let newTier = userProfile.status_tier;
    if (newVisitCount >= settings.gold_threshold && userProfile.status_tier === 'Silver') {
      newTier = 'Gold';
    } else if (newVisitCount >= settings.platinum_threshold && userProfile.status_tier === 'Gold') {
      newTier = 'Platinum';
    }

    // Update user's loyalty stats
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('app_users')
      .update({
        total_confirmed_visits: newVisitCount,
        redeemable_points: userProfile.redeemable_points + pointsToAward,
        status_tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Record the transaction
    const { error: transactionError } = await supabaseAdmin
      .from('loyalty_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'EARNED',
        points_amount: pointsToAward,
        description: `Earned ${pointsToAward} points for booking #${bookingId.substring(0, 8)} (${basePoints} base points × ${multiplier}x tier bonus)`,
        booking_id: bookingId
      });

    if (transactionError) {
      throw transactionError;
    }

    // If tier was upgraded, record that transaction too
    let tierUpgradeTransaction = null;
    if (newTier !== userProfile.status_tier) {
      const { data: tierTransaction, error: tierTransactionError } = await supabaseAdmin
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'EARNED',
          points_amount: 0,
          description: `Congratulations! You've been upgraded to ${newTier} status after ${newVisitCount} visits.`,
          booking_id: bookingId
        })
        .select()
        .single();

      if (tierTransactionError) {
        throw tierTransactionError;
      }
      
      tierUpgradeTransaction = tierTransaction;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pointsAwarded: pointsToAward,
        newVisitCount,
        newTier,
        previousTier: userProfile.status_tier,
        tierUpgraded: newTier !== userProfile.status_tier,
        tierUpgradeTransaction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});