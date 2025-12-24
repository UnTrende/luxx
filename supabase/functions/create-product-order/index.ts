// FIX: Updated to a stable, versioned Deno types URL to resolve TypeScript errors.
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';
import { successResponse, handleError } from '../_shared/response.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("=== START create-product-order DEBUG ===", undefined, 'index');

    // Log raw request
    const requestBody = await req.text();
    console.log("📥 Raw request body:", requestBody, 'index');

    // Parse request
    const parsedBody = JSON.parse(requestBody);
    const { order } = parsedBody;

    console.log("📥 Parsed order:", { order }, 'index');

    // Authenticate user
    console.log("🔐 Authenticating user...", undefined, 'index');
    const user = await authenticateUser(req);
    console.log("👤 Authenticated user result:", { userId: user?.id, hasEmail: !!user?.email }, 'index');

    // Validate input
    if (!order) {
      throw new Error("Order data is missing");
    }

    if (!order.productId) {
      throw new Error("Product ID is required");
    }

    if (!order.quantity) {
      throw new Error("Quantity is required");
    }

    // Validate user
    if (!user || !user.id) {
      throw new Error("User authentication failed - no user ID");
    }

    console.log("📦 Fetching product details...", undefined, 'index');
    // Fetch product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('name, price, stock')
      .eq('id', order.productId)
      .single();

    if (productError) {
      console.error("Product fetch error:", productError, 'index');
      throw new Error(`Product fetch failed: ${productError.message}`);
    }

    if (!product) {
      throw new Error("Product not found with ID: " + order.productId);
    }

    console.log("🛍️ Product found:", { name: product.name, stock: product.stock, price: product.price }, 'index');

    // Check stock availability
    if (product.stock < order.quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${order.quantity}`);
    }

    console.log("📝 Creating order record...", undefined, 'index');
    // Create order record
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('product_orders')
      .insert({
        product_id: order.productId,
        user_id: user.id,
        // user_name column removed in migration
        quantity: order.quantity,
        status: 'pending',
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError, 'index');
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    // Validate newOrder
    if (!newOrder || !newOrder.id) {
      throw new Error("Failed to create order record - no ID returned");
    }

    console.log("✅ Order created:", { orderId: newOrder.id }, 'index');

    console.log("📉 Updating product stock...", undefined, 'index');
    // Update product stock
    const { error: stockError } = await supabaseAdmin
      .from('products')
      .update({ stock: product.stock - order.quantity })
      .eq('id', order.productId);

    if (stockError) {
      console.error("Stock update error:", stockError, 'index');
      throw new Error(`Stock update failed: ${stockError.message}`);
    }

    console.log("🔔 Creating notifications...", undefined, 'index');
    // Create notification for admins
    const { data: admins } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        recipient_id: admin.id,
        type: 'NEW_ORDER',
        message: `New order: ${user.email ? user.email.split('@')[0] : 'Unknown User'} ordered ${order.quantity}x ${product.name}`,
        payload: { orderId: newOrder.id }
      }));

      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error("Failed to create notifications:", notificationError.message, 'index');
      }
    }

    console.log("✅ Order created successfully:", newOrder.id, 'index');
    console.log("=== END create-product-order DEBUG ===", undefined, 'index');

    return successResponse(newOrder, 201);
  } catch (error) {
    console.error("💥 Error creating product order:", error, 'index');
    console.log("=== ERROR END create-product-order DEBUG ===", undefined, 'index');
    return handleError(error, "create-product-order");
  }
});