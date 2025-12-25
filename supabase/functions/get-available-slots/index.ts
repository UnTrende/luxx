// supabase/functions/get-available-slots/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-CSRF-Token',
};

// Utility: Convert time string to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Utility: Convert minutes since midnight to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour12}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Check if two time ranges overlap
const rangesOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
  return start1 < end2 && start2 < end1;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const barberId = url.searchParams.get('barberId');
    const date = url.searchParams.get('date');
    const serviceIdsParam = url.searchParams.get('serviceIds');
    const serviceIds = serviceIdsParam ? serviceIdsParam.split(',') : [];

    if (!barberId || !date) {
      return new Response(
        JSON.stringify({ error: 'Barber ID and date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Get service durations and calculate total time needed
    let totalDuration = 60; // Default 1 hour if no services provided

    if (serviceIds && serviceIds.length > 0) {
      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .select('duration')
        .in('id', serviceIds);

      if (servicesError) throw servicesError;

      totalDuration = services.reduce((sum: number, service: any) => sum + (service.duration || 0), 0);
    }

    // Step 2: Get barber's hidden hours (unavailable times) from DB
    let hiddenHours: string[] = [];
    const { data: settingsRow, error: settingsError } = await supabaseClient
      .from('barber_settings')
      .select('hidden_hours')
      .eq('barber_id', barberId)
      .maybeSingle();
    if (settingsError) {
      console.warn('Failed to load barber_settings, proceeding with empty hidden hours:', settingsError.message, 'index');
    }
    hiddenHours = Array.isArray(settingsRow?.hidden_hours) ? settingsRow!.hidden_hours as string[] : [];

    // Step 3: Get ACTIVE bookings for this barber on this date
    // Only pending and confirmed bookings block time slots
    // Completed and cancelled bookings don't block future bookings
    const { data: existingBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('timeslot, service_ids, status')
      .eq('barber_id', barberId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);
    
    console.log('🔧 get-available-slots: Active bookings (pending/confirmed) for barber', barberId, 'on', date, ':', existingBookings, 'index');

    if (bookingsError) throw bookingsError;

    // Step 4: Calculate duration for each existing booking
    // Collect all unique service IDs from all bookings
    const allServiceIds = new Set<string>();
    (existingBookings || []).forEach(booking => {
      if (booking.service_ids && booking.service_ids.length > 0) {
        booking.service_ids.forEach((id: string) => allServiceIds.add(id));
      }
    });

    // Batch fetch all service durations in ONE query
    const serviceDurationMap = new Map<string, number>();
    if (allServiceIds.size > 0) {
      const { data: allServices } = await supabaseClient
        .from('services')
        .select('id, duration')
        .in('id', Array.from(allServiceIds));

      if (allServices) {
        allServices.forEach((service: any) => {
          serviceDurationMap.set(service.id, service.duration || 0);
        });
      }
    }

    // Now calculate booked ranges using the cached service durations
    const bookedRanges: Array<{ start: number; end: number }> = [];
    for (const booking of existingBookings || []) {
      const startMinutes = timeToMinutes(booking.timeslot);
      let bookingDuration = 60; // Default

      // Get duration of booked services from our map
      if (booking.service_ids && booking.service_ids.length > 0) {
        bookingDuration = booking.service_ids.reduce((sum: number, serviceId: string) => {
          return sum + (serviceDurationMap.get(serviceId) || 0);
        }, 0);
      }

      bookedRanges.push({
        start: startMinutes,
        end: startMinutes + bookingDuration
      });
    }

    // Step 5: Generate 15-minute interval slots from 9 AM to 6 PM
    const workStart = 9 * 60; // 9:00 AM in minutes
    const workEnd = 18 * 60;  // 6:00 PM in minutes
    const interval = 15; // 15-minute intervals

    const availableSlots: string[] = [];

    for (let slotStart = workStart; slotStart < workEnd; slotStart += interval) {
      const slotEnd = slotStart + totalDuration;
      const slotTime = minutesToTime(slotStart);

      // Check if service fits within working hours
      if (slotEnd > workEnd) continue;

      // Check if this time slot is in hidden hours
      if (hiddenHours.includes(slotTime)) continue;

      // Check if this slot conflicts with any existing booking
      const hasConflict = bookedRanges.some(range =>
        rangesOverlap(slotStart, slotEnd, range.start, range.end)
      );

      if (!hasConflict) {
        availableSlots.push(slotTime);
      }
    }

    return new Response(
      JSON.stringify(availableSlots),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error, 'index');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});