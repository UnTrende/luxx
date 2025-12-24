import { CacheService } from './cache-service.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';

const cache = new CacheService();

export async function getCachedBarberSchedule(
  barberId: string,
  date: string
) {
  const key = `barber:${barberId}:schedule:${date}`;
  
  return cache.getOrSet(key, async () => {
    const { data, error } = await supabaseAdmin
      .from('barber_availability')
      .select('*')
      .eq('barber_id', barberId)
      .eq('date', date)
      .eq('is_available', true);
      
    if (error) throw error;
    return data;
  }, 300, [`barber:${barberId}`, 'schedules']);
}

export async function getCachedServices() {
  return cache.getOrSet('services:all', async () => {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price');
      
    if (error) throw error;
    return data;
  }, 3600, ['services']); // Cache for 1 hour
}