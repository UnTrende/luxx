import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Service } from '../../types';
import { logger } from '../../src/lib/logger';

const fetchServices = async (): Promise<Service[]> => {
  const response = await api.getServices();
  return response || [];
};

const createService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  const response = await api.addService(serviceData);
  return response;
};

const updateService = async (serviceData: Service): Promise<Service> => {
  const response = await api.updateService(serviceData.id, serviceData);
  return response;
};

const deleteService = async (serviceId: string): Promise<{ success: boolean }> => {
  const response = await api.deleteService(serviceId);
  return response;
};

export const useServices = () => {
  return useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      logger.error('Failed to create service:', error, 'useServices');
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateService,
    onSuccess: (updatedService) => {
      // Update the service in the cache
      queryClient.setQueryData<Service[]>(['services'], (oldServices = []) => {
        return oldServices.map(service => 
          service.id === updatedService.id ? updatedService : service
        );
      });
    },
    onError: (error) => {
      logger.error('Failed to update service:', error, 'useServices');
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      logger.error('Failed to delete service:', error, 'useServices');
    },
  });
};