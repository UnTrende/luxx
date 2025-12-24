import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { Booking } from '../../../types';
import { logger } from '../../../src/lib/logger';

// We'll implement these functions properly once we understand the data structure better
const fetchBookings = async (filters?: any): Promise<Booking[]> => {
  try {
    const response = await api.getAllBookings();
    // Add computed properties for filtering
    return response.map((booking: unknown) => ({
      ...booking,
      isToday: new Date(booking.date).toDateString() === new Date().toDateString(),
      isUpcoming: new Date(booking.date) > new Date(),
      isPast: new Date(booking.date) < new Date(),
    }));
  } catch (error) {
    logger.error('Error fetching bookings:', error, 'useBookingsData');
    return [];
  }
};

const fetchBookingStats = async (): Promise<any> => {
  try {
    const response = await api.getAllBookings();
    const today = new Date().toISOString().split('T')[0];
    
    const todayStats = response.filter((b: unknown) => 
      new Date(b.date).toISOString().split('T')[0] === today
    );
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyStats = response.filter((b: unknown) => 
      new Date(b.date) >= oneWeekAgo
    );
    
    return {
      today: todayStats.length || 0,
      thisWeek: weeklyStats.length || 0,
      pending: (todayStats.filter((b: unknown) => b.status === 'pending') || []).length,
      revenueToday: (todayStats.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0) || 0),
      revenueThisWeek: (weeklyStats.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0) || 0),
    };
  } catch (error) {
    logger.error('Error fetching booking stats:', error, 'useBookingsData');
    return { today: 0, thisWeek: 0, pending: 0, revenueToday: 0, revenueThisWeek: 0 };
  }
};

export const useBookingsData = (filters?: any, activeTab?: string) => {
  const queryClient = useQueryClient();

  // Main bookings query
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Booking[], Error>({
    queryKey: ['admin-bookings', filters, activeTab],
    queryFn: () => fetchBookings(filters),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Stats query (separate to avoid refetching stats when bookings change)
  const { data: stats = { today: 0, thisWeek: 0, pending: 0, revenueToday: 0, revenueThisWeek: 0 } } = useQuery({
    queryKey: ['admin-booking-stats'],
    queryFn: fetchBookingStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }) => {
      try {
        const response = await api.updateBookingStatus(bookingId, status);
        return { bookingId, status, booking: response.booking };
      } catch (error) {
        logger.error('Error updating booking status:', error, 'useBookingsData');
        throw error;
      }
    },
    onSuccess: ({ bookingId, status, booking }) => {
      // Update cache optimistically
      queryClient.setQueryData<Booking[]>(['admin-bookings', filters, activeTab], 
        (old = []) => old.map(b => 
          b.id === bookingId ? { ...b, status, ...(booking || {}) } : b
        ) as Booking[]
      );
      
      // Also update stats
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    },
  });

  // Delete booking mutation
  const deleteMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // We don't have a direct delete API, so we'll cancel the booking instead
      try {
        const response = await api.updateBookingStatus(bookingId, 'cancelled');
        return { bookingId, booking: response.booking };
      } catch (error) {
        logger.error('Error cancelling booking:', error, 'useBookingsData');
        throw error;
      }
    },
    onSuccess: ({ bookingId, booking }) => {
      // Update cache optimistically
      queryClient.setQueryData<Booking[]>(['admin-bookings', filters, activeTab], 
        (old = []) => old.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled', ...(booking || {}) } : b
        ) as Booking[]
      );
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    },
  });

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return {
    bookings,
    stats,
    isLoading,
    error,
    updateBookingStatus: updateStatusMutation.mutate,
    deleteBooking: deleteMutation.mutate,
    refetch,
  };
};