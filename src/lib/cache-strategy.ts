import { QueryClient } from '@tanstack/react-query';

/**
 * Advanced Cache Strategy for React Query.
 * Provides tiered caching rules for different data types.
 */
export class CacheStrategy {
    private queryClient: QueryClient;

    // Cache configurations for different data types
    readonly cacheConfigs = {
        // Public data (services, barbers) - cache for 30 minutes
        public: {
            staleTime: 1000 * 60 * 30,
            gcTime: 1000 * 60 * 60,
            refetchOnMount: false as const,
        },
        // User-specific data (bookings, loyalty) - cache for 5 minutes
        user: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 15,
            refetchOnMount: true as const,
        },
        // Admin data - cache for 2 minutes, refresh in background
        admin: {
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 10,
            refetchOnMount: 'always' as const,
            refetchInterval: 1000 * 60 * 2,
        },
        // Real-time data (attendance, live bookings) - minimal cache
        realtime: {
            staleTime: 1000 * 30,
            gcTime: 1000 * 60 * 2,
            refetchOnMount: 'always' as const,
            refetchInterval: 1000 * 30,
        },
    };

    constructor(queryClient: QueryClient) {
        this.queryClient = queryClient;
    }

    /**
     * Prefetch critical data on app load based on user role.
     */
    async prefetchCriticalData(userRole?: string) {
        const prefetchPromises = [];

        // Always prefetch public data
        prefetchPromises.push(
            this.queryClient.prefetchQuery({
                queryKey: ['services'],
                ...this.cacheConfigs.public,
            }),
            this.queryClient.prefetchQuery({
                queryKey: ['barbers'],
                ...this.cacheConfigs.public,
            })
        );

        if (userRole === 'customer') {
            prefetchPromises.push(
                this.queryClient.prefetchQuery({
                    queryKey: ['user-bookings'],
                    ...this.cacheConfigs.user,
                })
            );
        } else if (userRole === 'admin') {
            prefetchPromises.push(
                this.queryClient.prefetchQuery({
                    queryKey: ['admin-overview'],
                    ...this.cacheConfigs.admin,
                })
            );
        }

        await Promise.allSettled(prefetchPromises);
    }

    /**
     * Invalidate related queries when an event occurs.
     */
    invalidateRelatedQueries(eventType: string, data?: any) {
        switch (eventType) {
            case 'BOOKING_CREATED':
                this.queryClient.invalidateQueries({ queryKey: ['bookings'] });
                this.queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
                this.queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
                break;
            case 'PRODUCT_UPDATED':
                this.queryClient.invalidateQueries({ queryKey: ['product', data?.productId] });
                this.queryClient.invalidateQueries({ queryKey: ['products'] });
                break;
            case 'BARBER_STATUS_CHANGED':
                this.queryClient.invalidateQueries({ queryKey: ['barbers'] });
                break;
        }
    }

    /**
     * Clear all user-sensitive cache on logout.
     */
    clearUserSensitiveCache() {
        const queryCache = this.queryClient.getQueryCache();
        const allQueries = queryCache.getAll();

        allQueries.forEach((query) => {
            if (
                query.queryKey.some(
                    (key: unknown) =>
                        typeof key === 'string' &&
                        (key.includes('user') || key.includes('admin') || key.includes('barber'))
                )
            ) {
                queryCache.remove(query);
            }
        });
    }
}
