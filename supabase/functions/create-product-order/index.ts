// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order } = await req.json(); // { productId, quantity }

    // Log incoming request for debugging
    console.log("📥 create-product-order called with:", { order });

    // Validate input
    if (!order.productId || !order.quantity) {
      throw new Error("Product ID and quantity are required.");
    }

    // Validate quantity is positive integer
    if (typeof order.quantity !== 'number' || order.quantity < 1 || !Number.isInteger(order.quantity)) {
      throw new Error("Quantity must be a positive integer.");
    }

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found.");

    // Get user name from correct metadata field
    const userName = user.user_metadata?.name || user.email || 'Unknown Customer';
    console.log("👤 User info:", { userId: user.id, userName });

    // ATOMIC STOCK DECREMENT: Single query ensures no race condition
    // Try to decrement the stock only if sufficient quantity exists
    const { data: updatedProduct, error: atomicError } = await supabaseAdmin
      .from('products')
      .update({ stock: supabaseAdmin.rpc ? undefined : undefined }) // placeholder to satisfy TS
      .select('id, stock')
      .eq('id', order.productId)
      .gte('stock', order.quantity)
      .select();

    // NOTE: Supabase JS doesn't support arithmetic in update directly; use SQL RPC instead.
    // We'll call a Postgres function via RPC to perform an atomic decrement.
    // Fallback: If the above "update with gte" isn't supported as intended, use RPC exclusively.
    let decremented = false;
    let productBeforeDecrement: { id: string; stock: number } | null = null;

    if (!atomicError && Array.isArray(updatedProduct) && updatedProduct.length > 0) {
      // This branch is kept for potential future SDK support; actual decrement will be done via RPC below
    }

    // Prefer RPC for atomicity: decrement stock if available and return new stock
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('decrement_product_stock', {
      p_product_id: order.productId,
      p_quantity: order.quantity
    });

    if (rpcError) {
      throw new Error(`Failed to update stock: ${rpcError.message}`);
    }

    if (!rpcResult || rpcResult.updated !== true) {
      const available = rpcResult?.available ?? 0;
      throw new Error(`Insufficient stock. Only ${available} items available.`);
    }

    decremented = true;
    productBeforeDecrement = { id: order.productId, stock: rpcResult.previous_stock };

    // Step 2: Create the order
    console.log("📦 Creating order with data:", {
      product_id: order.productId,
      quantity: order.quantity,
      user_id: user.id,
      username: userName,
      status: 'Reserved',
      timestamp: new Date().toISOString()
    });

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('product_orders')
      .insert({
        product_id: order.productId,  // database column is product_id
        quantity: order.quantity,
        user_id: user.id,             // database column is user_id
        username: userName,           // database column is username (lowercase!)
        status: 'Reserved',
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Order creation failed:", orderError);
      // Rollback: Restore stock if order creation fails
      await supabaseAdmin
        .from('products')
        .update({ stock: product.stock })
        .eq('id', order.productId);
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    console.log("✅ Order created successfully:", newOrder);

    return new Response(JSON.stringify(newOrder), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    console.error("💥 Error creating product order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});