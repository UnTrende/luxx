/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';

// Returns simple product sales analytics for the last 30 days
// - dailyRevenue: [{ date, revenue }]
// - topProducts: [{ product_id, name, revenue, quantity }]
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const days = Math.max(1, Math.min(90, Number(daysParam) || 30));

    // Get all orders in range
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch product_orders joined with products to get price
    const { data: orders, error } = await supabaseAdmin
      .from('product_orders')
      .select('id, product_id, quantity, timestamp, products:product_id (id, name, price)')
      .gte('timestamp', since.toISOString());

    if (error) throw error;

    const dailyMap = new Map<string, number>();
    const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();

    for (const o of orders ?? []) {
      const price = Number((o as any).products?.price) || 0;
      const name = (o as any).products?.name || 'Unknown';
      const qty = Number((o as any).quantity) || 0;
      const revenue = price * qty;
      const day = (o as any).timestamp?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + revenue);

      const pid = (o as any).product_id as string;
      const current = productMap.get(pid) || { name, revenue: 0, quantity: 0 };
      current.revenue += revenue;
      current.quantity += qty;
      productMap.set(pid, current);
    }

    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topProducts = Array.from(productMap.entries())
      .map(([product_id, v]) => ({ product_id, name: v.name, revenue: v.revenue, quantity: v.quantity }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return new Response(JSON.stringify({ dailyRevenue, topProducts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as any).message || String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
