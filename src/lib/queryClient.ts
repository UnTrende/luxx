import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes cache
      retry: (failureCount, error: Error | unknown) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Persist cache to localStorage (optional)
if (typeof window !== 'undefined') {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'luxecut-react-query-cache',
    serialize: (data) => {
      // Don't persist admin data for security
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([key]) => !key.includes('admin'))
      );
      return JSON.stringify(filtered);
    },
  });

  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 10, // 10 minutes (reduced from 24 hours to prevent stale data)
  });
}

// Prefetch patterns
export const prefetchQueries = async () => {
  // Prefetch user data if authenticated
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    // We'll implement this after we have the API functions
    // await queryClient.prefetchQuery({
    //   queryKey: ['user-profile'],
    //   queryFn: () => fetchUserProfile(),
    // });
  }
  
  // Prefetch public data
  // We'll implement these after we have the API functions
  // await queryClient.prefetchQuery({
  //   queryKey: ['services'],
  //   queryFn: () => fetchServices(),
  //   staleTime: 1000 * 60 * 30, // 30 minutes for services
  // });
  // 
  // await queryClient.prefetchQuery({
  //   queryKey: ['barbers'],
  //   queryFn: () => fetchBarbers(),
  //   staleTime: 1000 * 60 * 15, // 15 minutes for barbers
  // });
};