import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabaseClient';

export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  newCustomers: number;
  avgBookingValue: number;
  revenueChange: number;
  bookingsChange: number;
  customersChange: number;
  avgValueChange: number;
  topBarbers: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  popularServices: Array<{
    id: string;
    name: string;
    bookings: number;
    percentage: number;
  }>;
}

const fetchAnalyticsData = async (dateRange: '7d' | '30d' | '90d'): Promise<AnalyticsData> => {
  // Calculate date range
  const endDate = new Date();
  let startDate = new Date();
  
  switch (dateRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
  }

  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  // Fetch analytics data from Supabase
  // In a real implementation, this would likely call a specific analytics function
  // For now, we'll simulate the data structure
  
  // Fetch total revenue
  const { data: revenueData, error: revenueError } = await supabase
    .rpc('get_total_revenue', {
      start_date: startDateStr,
      end_date: endDateStr
    });

  if (revenueError) throw revenueError;

  // Fetch booking statistics
  const { data: bookingData, error: bookingError } = await supabase
    .rpc('get_booking_stats', {
      start_date: startDateStr,
      end_date: endDateStr
    });

  if (bookingError) throw bookingError;

  // Fetch top barbers
  const { data: topBarbers, error: barbersError } = await supabase
    .rpc('get_top_barbers', {
      start_date: startDateStr,
      end_date: endDateStr,
      limit: 5
    });

  if (barbersError) throw barbersError;

  // Fetch popular services
  const { data: popularServices, error: servicesError } = await supabase
    .rpc('get_popular_services', {
      start_date: startDateStr,
      end_date: endDateStr,
      limit: 5
    });

  if (servicesError) throw servicesError;

  // Simulate comparison data for percentage changes
  // In a real implementation, you would fetch previous period data
  const revenueChange = Math.random() * 20 - 10; // Random -10% to +10%
  const bookingsChange = Math.random() * 20 - 10;
  const customersChange = Math.random() * 20 - 10;
  const avgValueChange = Math.random() * 20 - 10;

  return {
    totalRevenue: revenueData?.total || 0,
    totalBookings: bookingData?.total_bookings || 0,
    newCustomers: bookingData?.new_customers || 0,
    avgBookingValue: bookingData?.avg_value || 0,
    revenueChange,
    bookingsChange,
    customersChange,
    avgValueChange,
    topBarbers: topBarbers || [],
    popularServices: popularServices || []
  };
};

export const useAnalytics = (dateRange: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: () => fetchAnalyticsData(dateRange),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
};