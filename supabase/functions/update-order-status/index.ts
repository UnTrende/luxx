import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        const { orderId, newStatus } = await req.json();

        if (!orderId || !newStatus) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Validate status value
        const validStatuses = ['Reserved', 'PickedUp', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify admin role
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin';

        if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403 });
        }

        // Get current order to check previous status
        const { data: currentOrder, error: fetchError } = await supabaseAdmin
            .from('product_orders')
            .select('*, products(stock)')
            .eq('id', orderId)
            .single();

        if (fetchError || !currentOrder) {
            return new Response(JSON.stringify({ error: 'Order not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // If changing to cancelled from Reserved, restore stock
        if (newStatus === 'cancelled' && currentOrder.status === 'Reserved') {
            const { error: stockError } = await supabaseAdmin
                .from('products')
                .update({
                    stock: (currentOrder.products?.stock || 0) + currentOrder.quantity
                })
                .eq('id', currentOrder.product_id);  // database column is product_id

            if (stockError) {
                console.error('Failed to restore stock:', stockError);
                // Continue with status update even if stock restoration fails
            }
        }

        // Update order status
        const { data, error } = await supabaseAdmin
            .from('product_orders')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        return new Response(JSON.stringify({ success: true, order: data }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (err) {
        console.error('Error updating order status:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
