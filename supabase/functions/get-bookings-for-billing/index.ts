import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts';
import { validateAuth } from '../_shared/auth.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') return handleCors(req);

    try {
        // Validate admin authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return createErrorResponse('Missing authorization header', 401);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const user = await validateAuth(supabase, ['admin']);
        if (!user) {
            return createErrorResponse('Unauthorized: Admin access required', 403);
        }

        // Calculate date range (last 7 days)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

        // Fetch bookings that can be billed:
        // - Status is 'confirmed' or 'pending'
        // - No transaction_id yet (not paid)
        // - Date is within last 7 days or today/future
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('id, user_id, barber_id, date, timeslot, totalprice, status, service_ids, transaction_id')
            .in('status', ['confirmed', 'pending'])
            .is('transaction_id', null)
            .gte('date', cutoffDate)
            .order('date', { ascending: true })
            .order('timeslot', { ascending: true });

        if (error) {
            console.error('Error fetching bookings:', error);
            return createErrorResponse(`Failed to fetch bookings: ${error.message}`, 500);
        }

        // Fetch users and barbers separately
        const userIds = [...new Set(bookings?.map(b => b.user_id).filter(Boolean))];
        const barberIds = [...new Set(bookings?.map(b => b.barber_id).filter(Boolean))];

        console.log('User IDs to fetch:', userIds);
        console.log('Barber IDs to fetch:', barberIds);

        // Try fetching with service role to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: users, error: usersError } = await supabaseAdmin
            .from('app_users')
            .select('id, name, email')
            .in('id', userIds);

        console.log('Fetched users:', users);
        console.log('Users error:', usersError);

        const { data: barbers, error: barbersError } = await supabase
            .from('barbers')
            .select('id, name')
            .in('id', barberIds);

        console.log('Fetched barbers:', barbers);
        console.log('Barbers error:', barbersError);

        // Fetch all services to enrich booking data
        const { data: services } = await supabase
            .from('services')
            .select('id, name, price');

        // Create lookup maps
        const usersMap = new Map(users?.map(u => [u.id, u]) || []);
        const barbersMap = new Map(barbers?.map(b => [b.id, b]) || []);
        const servicesMap = new Map(services?.map(s => [s.id, s]) || []);

        // Enrich bookings with service details
        const enrichedBookings = bookings.map(booking => {
            const user = usersMap.get(booking.user_id);
            const barber = barbersMap.get(booking.barber_id);
            const serviceDetails = (booking.service_ids || [])
                .map((serviceId: string) => servicesMap.get(serviceId))
                .filter(Boolean);

            return {
                id: booking.id,
                customer_id: booking.user_id,
                customer_name: user?.name || 'Unknown',
                customer_phone: user?.email || '',
                barber_id: booking.barber_id,
                barber_name: barber?.name || 'Unassigned',
                date: booking.date,
                timeSlot: booking.timeslot,
                totalPrice: booking.totalprice,
                status: booking.status,
                services: serviceDetails,
                serviceIds: booking.service_ids,
            };
        });

        return createSuccessResponse(enrichedBookings);
    } catch (error) {
        console.error('Unexpected error:', error);
        return createErrorResponse(`Internal server error: ${error.message}`, 500);
    }
});
