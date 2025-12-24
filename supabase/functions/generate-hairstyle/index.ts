import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

serve(async (req) => {
    try {
        // 1. Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
        }

        // 2. Authenticate the user
        // This ensures only logged-in users can generate hairstyles, preventing abuse
        const user = await authenticateUser(req);

        // 3. Rate Limiting
        // Create a Supabase client for the rate limit check
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use Service Role for DB access (rate_limits table)
        );

        // Limit to 5 requests per minute per user (Strict limit for expensive AI calls)
        const isAllowed = await checkRateLimit(req, supabaseClient, 5, 60);

        if (!isAllowed) {
            console.warn(`Rate limit exceeded for user ${user.id}`, undefined, 'index');
            return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 429,
            });
        }

        // 3. Parse request body
        const { image, prompt } = await req.json();

        if (!image || !prompt) {
            throw new Error('Missing image or prompt');
        }

        // 4. Get API Key from environment variables
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            console.error('GEMINI_API_KEY not set', undefined, 'index');
            throw new Error('Server configuration error');
        }

        // 5. Call Gemini API
        // We use the REST API directly to avoid complex dependency management in Deno if the SDK isn't fully compatible or needed
        const model = 'gemini-1.5-flash'; // Or 'gemini-pro-vision' depending on availability
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Construct the payload for Gemini API
        // Note: The image should be passed as base64. 
        // The client sends "data:image/png;base64,..." string, we need to strip the prefix if present
        const base64Image = image.includes('base64,') ? image.split('base64,')[1] : image;

        const payload = {
            contents: [{
                parts: [
                    { text: `Edit the hairstyle in this photo to be ${prompt}. Keep the person's face and background the same.` },
                    {
                        inline_data: {
                            mime_type: "image/jpeg", // Assuming jpeg/png, API is flexible
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText, 'index');
            throw new Error(`Gemini API failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract the generated image
        // Gemini returns candidates -> content -> parts
        const generatedPart = data.candidates?.[0]?.content?.parts?.find((p: unknown) => p.inline_data);

        if (!generatedPart) {
            // Sometimes it might return text if it refused to generate an image
            const textPart = data.candidates?.[0]?.content?.parts?.find((p: unknown) => p.text);
            if (textPart) {
                throw new Error(`AI refused to generate image: ${textPart.text}`);
            }
            throw new Error('No image generated');
        }

        const generatedImageBase64 = generatedPart.inline_data.data;
        const mimeType = generatedPart.inline_data.mime_type || 'image/png';
        const dataUrl = `data:${mimeType};base64,${generatedImageBase64}`;

        return new Response(JSON.stringify({ image: dataUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error('Error in generate-hairstyle:', error, 'index');
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});