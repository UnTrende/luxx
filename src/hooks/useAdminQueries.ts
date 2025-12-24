import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import { Service, Product, Barber, Booking, UserProfile, SiteSettings, Attendance, OrderWithDetails } from '../../types';

// Query Keys
export const ADMIN_KEYS = {
    all: ['admin'] as const,
    services: () => [...ADMIN_KEYS.all, 'services'] as const,
    products: () => [...ADMIN_KEYS.all, 'products'] as const,
    barbers: () => [...ADMIN_KEYS.all, 'barbers'] as const,
    users: () => [...ADMIN_KEYS.all, 'users'] as const,
    bookings: () => [...ADMIN_KEYS.all, 'bookings'] as const,
    orders: () => [...ADMIN_KEYS.all, 'orders'] as const,
    attendance: (date?: string) => [...ADMIN_KEYS.all, 'attendance', date] as const,
    rosters: () => [...ADMIN_KEYS.all, 'rosters'] as const,
    settings: () => [...ADMIN_KEYS.all, 'settings'] as const,
};

// --- SERVICES ---
export const useServices = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.services(),
        queryFn: () => api.getServices(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// --- PRODUCTS ---
export const useProducts = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.products(),
        queryFn: () => api.getProducts(),
        staleTime: 1000 * 60 * 5,
    });
};

// --- BARBERS ---
export const useBarbers = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.barbers(),
        queryFn: () => api.getBarbers(),
        staleTime: 1000 * 60 * 5,
    });
};

// --- USERS ---
export const useUsers = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.users(),
        queryFn: async () => {
            const { users } = await api.getAllUsers();
            return users as UserProfile[];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes (users don't change often)
    });
};

// --- BOOKINGS ---
export const useBookings = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.bookings(),
        queryFn: () => api.getAllBookings(),
        // Bookings change frequently, keep stale time lower or rely on invalidation
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: 1000 * 60, // Auto-refetch every minute
    });
};

// --- ORDERS ---
export const useOrders = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.orders(),
        queryFn: () => api.getAllOrders(),
        staleTime: 1000 * 60,
    });
};

// --- ATTENDANCE ---
export const useAttendance = (date?: string) => {
    const queryDate = date || new Date().toISOString().split('T')[0];
    return useQuery({
        queryKey: ADMIN_KEYS.attendance(queryDate),
        queryFn: () => api.getAttendance(queryDate),
        staleTime: 1000 * 60 * 5,
    });
};

// --- ROSTERS ---
export const useRosters = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.rosters(),
        queryFn: async () => {
            const { rosters } = await api.getRosters();
            return rosters;
        },
        staleTime: 1000 * 60 * 10,
    });
};

// --- SETTINGS ---
export const useSiteSettings = () => {
    return useQuery({
        queryKey: ADMIN_KEYS.settings(),
        queryFn: async () => {
            const response = await api.getSettings();
            return response.data || { shop_name: 'LuxeCut Barber Shop', allow_signups: true };
        },
        staleTime: Infinity, // Settings rarely change
    });
};

// --- MUTATIONS EXAMPLE (Can be expanded) ---
// Note: Mutations should invalidate relevant queries to auto-update the UI
export const useAdminMutations = () => {
    const queryClient = useQueryClient();

    const invalidate = (key: unknown[]) => queryClient.invalidateQueries({ queryKey: key });

    return {
        invalidateServices: () => invalidate(ADMIN_KEYS.services()),
        invalidateProducts: () => invalidate(ADMIN_KEYS.products()),
        invalidateBookings: () => invalidate(ADMIN_KEYS.bookings()),
        // ... add more as needed
    };
};
