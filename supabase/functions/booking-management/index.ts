/**
 * Consolidated Booking Management Function
 * Replaces: create-booking, update-booking-status, cancel-booking, 
 *          cancel-booking-by-barber, complete-booking-by-barber,
 *          get-my-bookings, get-all-bookings, get-available-slots,
 *          get-booked-slots, get-bookings-for-billing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { authenticateAdmin, authenticateUser } from '../_shared/auth.ts'
import { validateRequest } from '../_shared/validation-suite.ts'
import { logger } from '../_shared/response.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface BookingRequest {
  action: 'create' | 'update-status' | 'cancel' | 'cancel-by-barber' | 'complete-by-barber' | 
          'get-my-bookings' | 'get-all-bookings' | 'get-available-slots' | 'get-booked-slots' | 'get-for-billing'
  bookingId?: string
  barberId?: string
  data?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors()
  }

  try {
    const { action, bookingId, barberId, data }: BookingRequest = await req.json()
    
    switch (action) {
      case 'create':
        return await createBooking(req, data)
      case 'update-status':
        return await updateBookingStatus(req, bookingId!, data)
      case 'cancel':
        return await cancelBooking(req, bookingId!)
      case 'cancel-by-barber':
        return await cancelBookingByBarber(req, bookingId!)
      case 'complete-by-barber':
        return await completeBookingByBarber(req, bookingId!)
      case 'get-my-bookings':
        return await getMyBookings(req)
      case 'get-all-bookings':
        return await getAllBookings(req, data)
      case 'get-available-slots':
        return await getAvailableSlots(req, barberId!, data)
      case 'get-booked-slots':
        return await getBookedSlots(req, barberId!, data)
      case 'get-for-billing':
        return await getBookingsForBilling(req, data)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: corsHeaders }
        )
    }
  } catch (error) {
    console.error('Booking management error', error, 'booking-management')
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    )
  }
})

async function createBooking(req: Request, data: Record<string, unknown>) {
  const user = await authenticateUser(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  const validation = validateRequest(data, {
    barberId: { required: true, type: 'string' },
    serviceIds: { required: true, type: 'array', minLength: 1 },
    appointmentDate: { required: true, type: 'string' },
    appointmentTime: { required: true, type: 'string' },
    customerNotes: { required: false, type: 'string' }
  })

  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.errors }), { status: 400, headers: corsHeaders })
  }

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('barber_id', data.barberId)
    .eq('appointment_date', data.appointmentDate)
    .eq('appointment_time', data.appointmentTime)
    .in('status', ['confirmed', 'in_progress'])

  if (conflicts && conflicts.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Time slot is not available' }), 
      { status: 409, headers: corsHeaders }
    )
  }

  // Create booking
  const bookingData = {
    customer_id: user.profile.id,
    barber_id: data.barberId,
    appointment_date: data.appointmentDate,
    appointment_time: data.appointmentTime,
    customer_notes: data.customerNotes,
    status: 'confirmed',
    total_price: 0 // Will be calculated from services
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  if (bookingError) {
    console.error('Failed to create booking', bookingError, 'booking-management')
    return new Response(JSON.stringify({ error: bookingError.message }), { status: 500, headers: corsHeaders })
  }

  // Add booking services
  const bookingServices = data.serviceIds.map((serviceId: string) => ({
    booking_id: booking.id,
    service_id: serviceId
  }))

  const { error: servicesError } = await supabase
    .from('booking_services')
    .insert(bookingServices)

  if (servicesError) {
    // Rollback booking
    await supabase.from('bookings').delete().eq('id', booking.id)
    console.error('Failed to add booking services', servicesError, 'booking-management')
    return new Response(JSON.stringify({ error: 'Failed to create booking' }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(booking), { headers: corsHeaders })
}

async function updateBookingStatus(req: Request, bookingId: string, data: { status: string }) {
  const user = await authenticateUser(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  // Check permissions
  const { data: booking } = await supabase
    .from('bookings')
    .select('customer_id, barber_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: corsHeaders })
  }

  const isCustomer = user.profile.id === booking.customer_id
  const isBarber = user.profile.id === booking.barber_id
  const isAdmin = user.profile.role === 'admin'

  if (!isCustomer && !isBarber && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
  }

  const { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ status: data.status })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update booking status', error, 'booking-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(updatedBooking), { headers: corsHeaders })
}

async function cancelBooking(req: Request, bookingId: string) {
  return await updateBookingStatus(req, bookingId, { status: 'cancelled' })
}

async function cancelBookingByBarber(req: Request, bookingId: string) {
  const user = await authenticateUser(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  // Verify barber ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('barber_id')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.barber_id !== user.profile.id && user.profile.role !== 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
  }

  return await updateBookingStatus(req, bookingId, { status: 'cancelled' })
}

async function completeBookingByBarber(req: Request, bookingId: string) {
  const user = await authenticateUser(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  // Verify barber ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('barber_id')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.barber_id !== user.profile.id && user.profile.role !== 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
  }

  return await updateBookingStatus(req, bookingId, { status: 'completed' })
}

async function getMyBookings(req: Request) {
  const user = await authenticateUser(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      barbers (id, name, image_url),
      booking_services (
        services (id, name, price, duration)
      )
    `)
    .eq('customer_id', user.profile.id)
    .order('appointment_date', { ascending: false })

  if (error) {
    console.error('Failed to get user bookings', error, 'booking-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(bookings || []), { headers: corsHeaders })
}

async function getAllBookings(req: Request, data: Record<string, unknown>) {
  const user = await authenticateAdmin(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  let query = supabase
    .from('bookings')
    .select(`
      *,
      customers:customer_id (id, name, email),
      barbers (id, name),
      booking_services (
        services (id, name, price)
      )
    `)

  // Apply filters
  if (data?.status) {
    query = query.eq('status', data.status)
  }
  if (data?.barberId) {
    query = query.eq('barber_id', data.barberId)
  }
  if (data?.date) {
    query = query.eq('appointment_date', data.date)
  }

  const { data: bookings, error } = await query
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })

  if (error) {
    console.error('Failed to get all bookings', error, 'booking-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(bookings || []), { headers: corsHeaders })
}

async function getAvailableSlots(req: Request, barberId: string, data: { date: string }) {
  // Get barber's working hours (assumed 9AM-6PM for now)
  const workingHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  
  // Get booked slots
  const { data: bookings } = await supabase
    .from('bookings')
    .select('appointment_time')
    .eq('barber_id', barberId)
    .eq('appointment_date', data.date)
    .in('status', ['confirmed', 'in_progress'])

  const bookedTimes = bookings?.map(b => b.appointment_time) || []
  const availableSlots = workingHours.filter(time => !bookedTimes.includes(time))

  return new Response(JSON.stringify(availableSlots), { headers: corsHeaders })
}

async function getBookedSlots(req: Request, barberId: string, data: { date: string }) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('appointment_time, status')
    .eq('barber_id', barberId)
    .eq('appointment_date', data.date)
    .in('status', ['confirmed', 'in_progress'])

  if (error) {
    console.error('Failed to get booked slots', error, 'booking-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(bookings || []), { headers: corsHeaders })
}

async function getBookingsForBilling(req: Request, data: Record<string, unknown>) {
  const user = await authenticateAdmin(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  let query = supabase
    .from('bookings')
    .select(`
      *,
      customers:customer_id (id, name, email),
      barbers (id, name),
      booking_services (
        services (id, name, price)
      )
    `)
    .eq('status', 'completed')

  if (data?.startDate) {
    query = query.gte('appointment_date', data.startDate)
  }
  if (data?.endDate) {
    query = query.lte('appointment_date', data.endDate)
  }

  const { data: bookings, error } = await query
    .order('appointment_date', { ascending: false })

  if (error) {
    console.error('Failed to get bookings for billing', error, 'booking-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(bookings || []), { headers: corsHeaders })
}