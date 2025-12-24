
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateAdmin } from '../_shared/auth.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        await authenticateAdmin(req);
        const { reportType, dateRange } = await req.json();

        let data = {};

        if (reportType === 'retention') {
            // Calculate repeat customers
            // FILTER: Only consider COMPLETED or CONFIRMED bookings. Exclude 'cancelled'.
            // Note: DB status might be 'confirmed', 'completed', 'cancelled' (lowercase or Capitalized).
            // Using ilike or just excluding 'cancelled' and 'Canceled'.
            const { data: bookings } = await supabaseAdmin
                .from('bookings')
                .select('user_id, status')
                .neq('status', 'cancelled');

            const userCounts: Record<string, number> = {};
            bookings?.forEach(b => {
                // Also ensure we don't count guest bookings if user_id is null? 
                // Analytics usually focuses on Registered Users for Retention.
                // If user_id is present, count it.
                if (b.user_id) {
                    userCounts[b.user_id] = (userCounts[b.user_id] || 0) + 1;
                }
            });

            let single = 0;
            let repeat = 0;
            Object.values(userCounts).forEach(c => {
                if (c === 1) single++;
                else if (c > 1) repeat++;
            });

            // Avoid NaN
            const total = single + repeat;
            const retentionRate = total === 0 ? 0 : (repeat / total) * 100;

            data = {
                overview: { single, repeat },
                retentionRate
            };
        } else if (reportType === 'peak_times') {
            // Analyze time slots
            const { data: bookings } = await supabaseAdmin
                .from('bookings')
                .select('date, timeslot, day_of_week')
                .neq('status', 'cancelled');

            const hourCounts: Record<string, number> = {};
            const dayCounts: Record<string, number> = {};

            bookings?.forEach(b => {
                // Derive basic heatmap data
                if (b.timeslot) hourCounts[b.timeslot] = (hourCounts[b.timeslot] || 0) + 1;
                // Date parsing for day
                if (b.date) {
                    const day = new Date(b.date).toLocaleDateString('en-US', { weekday: 'long' });
                    dayCounts[day] = (dayCounts[day] || 0) + 1;
                }
            });

            data = { hourCounts, dayCounts };
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
