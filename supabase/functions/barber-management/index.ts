/**
 * Consolidated Barber Management Function
 * Replaces: add-barber, update-barber, delete-barber, get-barber-by-id, 
 *          get-barbers, get-barber-services, update-barber-services, 
 *          update-barber-availability, is-barber-available
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

interface BarberRequest {
  action: 'create' | 'update' | 'delete' | 'get' | 'list' | 'get-services' | 'update-services' | 'update-availability' | 'check-availability'
  barberId?: string
  data?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors()
  }

  try {
    const { action, barberId, data }: BarberRequest = await req.json()
    
    // Route to appropriate handler based on action
    switch (action) {
      case 'create':
        return await createBarber(req, data)
      case 'update':
        return await updateBarber(req, barberId!, data)
      case 'delete':
        return await deleteBarber(req, barberId!)
      case 'get':
        return await getBarberById(req, barberId!)
      case 'list':
        return await getBarbers(req)
      case 'get-services':
        return await getBarberServices(req, barberId!)
      case 'update-services':
        return await updateBarberServices(req, barberId!, data)
      case 'update-availability':
        return await updateBarberAvailability(req, barberId!, data)
      case 'check-availability':
        return await checkBarberAvailability(req, barberId!, data)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: corsHeaders }
        )
    }
  } catch (error) {
    console.error('Barber management error', error, 'barber-management')
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    )
  }
})

async function createBarber(req: Request, data: Record<string, unknown>) {
  const user = await authenticateAdmin(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  const validation = validateRequest(data, {
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    specialties: { required: false, type: 'array' },
    bio: { required: false, type: 'string' },
    image_url: { required: false, type: 'string' }
  })

  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.errors }), { status: 400, headers: corsHeaders })
  }

  const { data: barber, error } = await supabase
    .from('barbers')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Failed to create barber', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(barber), { headers: corsHeaders })
}

async function updateBarber(req: Request, barberId: string, data: Record<string, unknown>) {
  const user = await authenticateAdmin(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  const { data: barber, error } = await supabase
    .from('barbers')
    .update(data)
    .eq('id', barberId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update barber', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(barber), { headers: corsHeaders })
}

async function deleteBarber(req: Request, barberId: string) {
  const user = await authenticateAdmin(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  const { error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', barberId)

  if (error) {
    console.error('Failed to delete barber', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
}

async function getBarberById(req: Request, barberId: string) {
  // Public endpoint - no auth required
  const { data: barber, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('id', barberId)
    .single()

  if (error) {
    console.error('Failed to get barber', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(barber), { headers: corsHeaders })
}

async function getBarbers(req: Request) {
  // Public endpoint - no auth required
  const { data: barbers, error } = await supabase
    .from('barbers')
    .select('*')
    .order('name')

  if (error) {
    console.error('Failed to get barbers', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(barbers), { headers: corsHeaders })
}

async function getBarberServices(req: Request, barberId: string) {
  const { data: services, error } = await supabase
    .from('barber_services')
    .select(`
      id,
      services (
        id,
        name,
        price,
        duration,
        description,
        loyalty_points_bronze,
        loyalty_points_silver,
        loyalty_points_gold
      )
    `)
    .eq('barber_id', barberId)

  if (error) {
    console.error('Failed to get barber services', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  const serviceList = services?.map(bs => bs.services) || []
  return new Response(JSON.stringify(serviceList), { headers: corsHeaders })
}

async function updateBarberServices(req: Request, barberId: string, data: { serviceIds: string[] }) {
  const user = await authenticateAdmin(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  // Remove existing services
  await supabase
    .from('barber_services')
    .delete()
    .eq('barber_id', barberId)

  // Add new services
  if (data.serviceIds && data.serviceIds.length > 0) {
    const barberServices = data.serviceIds.map(serviceId => ({
      barber_id: barberId,
      service_id: serviceId
    }))

    const { error } = await supabase
      .from('barber_services')
      .insert(barberServices)

    if (error) {
      console.error('Failed to update barber services', error, 'barber-management')
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
  }

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
}

async function updateBarberAvailability(req: Request, barberId: string, data: Record<string, unknown>) {
  const user = await authenticateUser(req)
  if (!user.success) {
    return new Response(JSON.stringify({ error: user.error }), { status: 401, headers: corsHeaders })
  }

  // Check if user is the barber or an admin
  if (user.profile.role !== 'admin' && user.profile.id !== barberId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
  }

  const { data: barber, error } = await supabase
    .from('barbers')
    .update({ is_available: data.isAvailable })
    .eq('id', barberId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update barber availability', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify(barber), { headers: corsHeaders })
}

async function checkBarberAvailability(req: Request, barberId: string, data: { date: string, time: string }) {
  // Check if barber has any conflicting bookings
  const { data: conflicts, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('barber_id', barberId)
    .eq('appointment_date', data.date)
    .eq('appointment_time', data.time)
    .in('status', ['confirmed', 'in_progress'])

  if (error) {
    console.error('Failed to check barber availability', error, 'barber-management')
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  const isAvailable = conflicts.length === 0

  return new Response(JSON.stringify({ 
    isAvailable,
    barberId,
    date: data.date,
    time: data.time 
  }), { headers: corsHeaders })
}