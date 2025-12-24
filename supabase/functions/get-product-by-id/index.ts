// Edge function to get a single product by ID
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
        
        const { id } = await req.json();

        if (!id) {
            throw new Error("Product ID is required.");
        }

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select('id, name, description, categories, price, imageUrl:imageurl, stock')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return new Response(JSON.stringify({ error: "Product not found" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 404,
                });
            }
            throw error;
        }

        // Ensure stock is always a number
        const normalizedProduct = {
            ...product,
            stock: Number(product.stock)
        };

        return new Response(JSON.stringify(normalizedProduct), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching product by ID:", error, 'index');
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});