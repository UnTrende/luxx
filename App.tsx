import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import CustomerLayout from './components/layouts/CustomerLayout';
import { AdminLayout } from './src/pages/admin/AdminLayout';
import BarberLayout from './components/layouts/BarberLayout';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { isSupabaseConfigured } from './services/supabaseClient';
import ErrorBoundary from './components/ErrorBoundary';
import { initMonitoring } from './utils/monitoring';
import { api } from './services/api';
import { queryClient } from './src/lib/queryClient';
import { logger } from './src/lib/logger';

// Lazy load all page components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const BarbersPage = lazy(() => import('./pages/BarbersPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const AdminDashboardPageNew = lazy(() => import('./pages/AdminDashboardPageNew'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const BarberDashboardPage = lazy(() => import('./pages/BarberDashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const BarberProfilePage = lazy(() => import('./pages/BarberProfilePage'));
const BarberPublicProfilePage = lazy(() => import('./pages/BarberPublicProfilePage'));
const BarberAppointmentsPage = lazy(() => import('./pages/BarberAppointmentsPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const ProductOrderPage = lazy(() => import('./pages/ProductOrderPage'));
const OrderConfirmedPage = lazy(() => import('./pages/OrderConfirmedPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const AIHairstylePage = lazy(() => import('./pages/AIHairstylePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));

const AdminLoyaltySettingsPage = lazy(() => import('./pages/AdminLoyaltySettingsPage'));

// Lazy load new admin components - UNUSED
// const BookingsManager = lazy(() => import('./src/pages/admin/BookingsManager'));
// const BarbersManager = lazy(() => import('./src/pages/admin/BarbersManager'));
// const ProductsManager = lazy(() => import('./src/pages/admin/ProductsManager'));
// const AnalyticsDashboard = lazy(() => import('./src/pages/admin/AnalyticsDashboard'));

// Navigation logger component to track all route changes
const NavigationLogger: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    logger.debug('Route changed', {
      pathname: location.pathname,
      hash: location.hash,
      fullPath: location.pathname + location.hash,
      state: location.state
    }, 'NavigationLogger');
  }, [location]);

  return null;
};

function App() {
  useEffect(() => {
    api.fetchCSRFToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <SettingsProvider>
            {!isSupabaseConfigured && (
              <div
                className="bg-yellow-500 text-black p-2 text-center font-semibold text-sm shadow-md"
                aria-live="polite"
              >
                App is running in Demo Mode. Backend is not configured.
              </div>
            )}
            <HashRouter>
              <NavigationLogger />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Customer Routes - "The Virtual Concierge" */}
                  <Route element={<CustomerLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="barbers" element={<BarbersPage />} />
                    <Route path="barbers/:id" element={<BarberPublicProfilePage />} />
                    <Route path="book/:barberId" element={<BookingPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="product-order/:id" element={<ProductOrderPage />} />
                    <Route path="order-confirmed/:orderId" element={<OrderConfirmedPage />} />
                    <Route path="my-bookings" element={<MyBookingsPage />} />
                    <Route path="my-orders" element={<MyOrdersPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="profile/edit" element={<EditProfilePage />} />
                    <Route path="profile/payment" element={<PaymentPage />} />
                    <Route path="profile/settings" element={<SettingsPage />} />
                    <Route path="profile/support" element={<SupportPage />} />
                    <Route path="profile/rewards" element={<RewardsPage />} />
                    <Route path="ai-hairstyles" element={<AIHairstylePage />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="login" element={<LoginPage />} />
                  </Route>

                  {/* Admin Routes - "The Empire View" */}
                  {/* Replaced AdminLayout with direct AdminDashboardPageNew to prevent double navigation bars */}
                  <Route path="/admin" element={<AdminDashboardPageNew />} />
                  {/* 
                    Sub-routes are currently handled internally by AdminDashboardPageNew's state.
                    If individual route access is needed later, AdminDashboardPageNew needs to be refactored to use routing.
                  
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPageNew />} />
                    <Route path="bookings" element={<BookingsManager />} />
                    <Route path="barbers" element={<BarbersManager />} />
                    <Route path="products" element={<ProductsManager />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="loyalty-settings" element={<AdminLoyaltySettingsPage />} />
                  </Route> 
                  */}

                  {/* Barber Routes - "The Atelier" */}
                  <Route path="barber-admin" element={<BarberLayout />}>
                    <Route index element={<BarberDashboardPage />} />
                    <Route path="appointments" element={<BarberAppointmentsPage />} />
                    <Route path="profile" element={<BarberProfilePage />} />
                  </Route>
                </Routes>
              </Suspense>
            </HashRouter>
          </SettingsProvider>
        </AuthProvider>
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;