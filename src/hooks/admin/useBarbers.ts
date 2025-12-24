import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabaseClient';

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  specialties?: string[];
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

const fetchBarbers = async (): Promise<Barber[]> => {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const updateBarberStatus = async ({ 
  barberId, 
  status 
}: { 
  barberId: string; 
  status: 'active' | 'inactive' | 'pending' 
}): Promise<void> => {
  const { error } = await supabase
    .from('barbers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', barberId);

  if (error) throw error;
};

const deleteBarber = async (barberId: string): Promise<void> => {
  const { error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', barberId);

  if (error) throw error;
};

export const useBarbers = () => {
  const queryClient = useQueryClient();

  const {
    data: barbers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-barbers'],
    queryFn: fetchBarbers,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateBarberStatus,
    onSuccess: (_, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(['admin-barbers'], 
        (old: Barber[]) => old.map(b => 
          b.id === variables.barberId ? { ...b, status: variables.status } : b
        )
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBarber,
    onSuccess: (_, barberId) => {
      // Remove from cache optimistically
      queryClient.setQueryData(['admin-barbers'], 
        (old: Barber[]) => old.filter(b => b.id !== barberId)
      );
    },
  });

  return {
    barbers,
    isLoading,
    error,
    updateBarberStatus: updateStatusMutation.mutate,
    deleteBarber: deleteMutation.mutate,
    refetch,
  };
};