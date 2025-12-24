import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { requestNotificationPermission } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../src/lib/logger';

const useScopedAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    // Don't run redirect logic while auth state is loading
    if (isLoading) {
      logger.info('⏳ useScopedAuthRedirect: Auth state loading, skipping redirect check', undefined, 'SharedLayout');
      return;
    }
    
    // Comprehensive logging for debugging
    logger.info('📍 NAVIGATION DEBUG: useScopedAuthRedirect triggered', undefined, 'LegacyConsole');

    // For HashRouter, we need to check the hash portion of the URL
    const fullPath = location.pathname + location.hash;
    
    // Check if we're trying to access admin routes
    const isAdminRoute = fullPath.startsWith('/admin') || fullPath.startsWith('/#/admin');
    const isBarberRoute = fullPath.startsWith('/barber-admin') || fullPath.startsWith('/#/barber-admin');
    const isLoginRoute = fullPath === '/login' || fullPath === '/#/login';
    
    logger.info('🔄 useScopedAuthRedirect: Conditions', undefined, 'LegacyConsole');

    // Handle admin route access
    if (isAdminRoute) {
      if (!user) {
        // Not logged in, redirect to login
        logger.info('🚨 useScopedAuthRedirect: Redirecting to login (not authenticated)', undefined, 'SharedLayout');
        navigate('/login', { replace: true });
        return;
      } else if (user.role !== 'admin') {
        // Logged in but not admin, redirect to home
        logger.info('🚨 useScopedAuthRedirect: Redirecting to home (not admin)', undefined, 'SharedLayout');
        navigate('/', { replace: true });
        return;
      } else {
        // Admin user, allow access
        logger.info('✅ useScopedAuthRedirect: Admin access granted', undefined, 'SharedLayout');
        return;
      }
    }
    
    // Handle barber route access
    if (isBarberRoute) {
      if (!user) {
        // Not logged in, redirect to login
        logger.info('🚨 useScopedAuthRedirect: Redirecting to login (not authenticated)', undefined, 'SharedLayout');
        navigate('/login', { replace: true });
        return;
      } else if (user.role !== 'barber') {
        // Logged in but not barber, redirect to home
        logger.info('🚨 useScopedAuthRedirect: Redirecting to home (not barber)', undefined, 'SharedLayout');
        navigate('/', { replace: true });
        return;
      } else {
        // Barber user, allow access
        logger.info('✅ useScopedAuthRedirect: Barber access granted', undefined, 'SharedLayout');
        return;
      }
    }
    
    // Handle login route access for authenticated users
    if (isLoginRoute && user) {
      // Redirect authenticated users to appropriate dashboard
      if (user.role === 'admin') {
        logger.info('🚨 useScopedAuthRedirect: Redirecting admin from login to admin dashboard', undefined, 'SharedLayout');
        navigate('/admin', { replace: true });
        return;
      } else if (user.role === 'barber') {
        logger.info('🚨 useScopedAuthRedirect: Redirecting barber from login to barber dashboard', undefined, 'SharedLayout');
        navigate('/barber-admin', { replace: true });
        return;
      } else {
        // Regular customer, redirect to bookings
        logger.info('🚨 useScopedAuthRedirect: Redirecting customer from login to bookings', undefined, 'SharedLayout');
        navigate('/my-bookings', { replace: true });
        return;
      }
    }

    // TEMPORARILY DISABLED - INFINITE LOOP FIX
    const isHomePage = fullPath === '/' || fullPath === '/#' || fullPath === '/#/';
    if (user && user.role === 'admin' && isHomePage && !isAdminRoute) {
      logger.info('🚨 LOOP PREVENTION: Would redirect admin but disabled to stop infinite loop', undefined, 'SharedLayout');
      // navigate('/admin', { replace: true });
      // return;
    }
    
    // Handle customer redirects to my-bookings
    const isLanding = fullPath === '/' || fullPath === '/#' || fullPath === '/#/';
    if (user && user.role === 'customer' && isLanding) {
      logger.info('🚨 useScopedAuthRedirect: Redirecting customer to my-bookings', undefined, 'SharedLayout');
      navigate('/my-bookings', { replace: true });
      return;
    }
    
    logger.info('✅ useScopedAuthRedirect: No redirect needed', undefined, 'SharedLayout');
  }, [user, isLoading, location, navigate]);
};;

const SharedLayout: React.FC = () => {
  useScopedAuthRedirect();
  
  useEffect(() => {
    const userString = localStorage.getItem('loggedInUser');
    if (userString) {
      // If a user is logged in, request permission if it's not already determined.
      if ('Notification' in window && Notification.permission === 'default') {
         requestNotificationPermission();
      }
    }
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8 md:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default SharedLayout;