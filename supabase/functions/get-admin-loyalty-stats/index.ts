import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateAdmin } from '../_shared/auth.ts';

interface AdminLoyaltyStats {
  totalMembers: number;
  activePoints: number;
  tierDistribution: {
    Silver: number;
    Gold: number;
    Platinum: number;
  };
  recentActivity: number;
  totalPointsIssued?: number;
  totalPointsRedeemed?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate Admin (uses shared helper)
    await authenticateAdmin(req);

    // 2. Get total members (customers)
    const { count: totalMembers, error: membersError } = await supabaseAdmin
      .from('app_users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (membersError) {
      console.error('Error fetching total members:', membersError, 'index');
    }

    // 3. Get sum of active points
    const { data: pointsData, error: pointsError } = await supabaseAdmin
      .from('app_users')
      .select('redeemable_points')
      .eq('role', 'customer');

    let activePoints = 0;
    if (!pointsError && pointsData) {
      activePoints = pointsData.reduce((sum, user) => sum + (user.redeemable_points || 0), 0);
    } else {
      console.error('Error fetching active points:', pointsError, 'index');
    }

    // 4. Get tier distribution
    const { data: tierData, error: tierError } = await supabaseAdmin
      .from('app_users')
      .select('status_tier')
      .eq('role', 'customer');

    const tierDistribution = {
      Silver: 0,
      Gold: 0,
      Platinum: 0,
    };

    if (!tierError && tierData) {
      tierData.forEach((user) => {
        const tier = user.status_tier || 'Silver';
        if (tier in tierDistribution) {
          tierDistribution[tier as keyof typeof tierDistribution]++;
        }
      });
    } else {
      console.error('Error fetching tier distribution:', tierError, 'index');
    }

    // 5. Get recent activity (transactions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentActivity, error: activityError } = await supabaseAdmin
      .from('loyalty_transactions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (activityError) {
      console.error('Error fetching recent activity:', activityError, 'index');
    }

    // 6. Optional: Get total points issued (EARNED transactions)
    const { data: earnedData, error: earnedError } = await supabaseAdmin
      .from('loyalty_transactions')
      .select('points_amount')
      .eq('transaction_type', 'EARNED');

    let totalPointsIssued = 0;
    if (!earnedError && earnedData) {
      totalPointsIssued = earnedData.reduce((sum, tx) => sum + (tx.points_amount || 0), 0);
    }

    // 7. Optional: Get total points redeemed (REDEEMED transactions)
    const { data: redeemedData, error: redeemedError } = await supabaseAdmin
      .from('loyalty_transactions')
      .select('points_amount')
      .eq('transaction_type', 'REDEEMED');

    let totalPointsRedeemed = 0;
    if (!redeemedError && redeemedData) {
      totalPointsRedeemed = redeemedData.reduce((sum, tx) => sum + Math.abs(tx.points_amount || 0), 0);
    }

    // Build response
    const stats: AdminLoyaltyStats = {
      totalMembers: totalMembers || 0,
      activePoints: activePoints,
      tierDistribution: tierDistribution,
      recentActivity: recentActivity || 0,
      totalPointsIssued: totalPointsIssued,
      totalPointsRedeemed: totalPointsRedeemed,
    };

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-admin-loyalty-stats:', error, 'index');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
