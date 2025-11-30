import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { requestNotificationPermission } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

const useScopedAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    // Don't run redirect logic while auth state is loading
    if (isLoading) {
      console.log('⏳ useScopedAuthRedirect: Auth state loading, skipping redirect check');
      return;
    }
    
    // Comprehensive logging for debugging
    console.log('📍 NAVIGATION DEBUG: useScopedAuthRedirect triggered', {
      location: location,
      pathname: location.pathname,
      hash: location.hash,
      fullPath: location.pathname + location.hash,
      userExists: !!user,
      userRole: user?.role,
      isLoading,
      didRunCurrent: didRun.current
    });

    // For HashRouter, we need to check the hash portion of the URL
    const fullPath = location.pathname + location.hash;
    
    // Check if we're trying to access admin routes
    const isAdminRoute = fullPath.startsWith('/admin') || fullPath.startsWith('/#/admin');
    const isBarberRoute = fullPath.startsWith('/barber-admin') || fullPath.startsWith('/#/barber-admin');
    const isLoginRoute = fullPath === '/login' || fullPath === '/#/login';
    
    console.log('🔄 useScopedAuthRedirect: Conditions', {
      fullPath,
      isAdminRoute,
      isBarberRoute,
      isLoginRoute,
      userRole: user?.role
    });

    // Handle admin route access
    if (isAdminRoute) {
      if (!user) {
        // Not logged in, redirect to login
        console.log('🚨 useScopedAuthRedirect: Redirecting to login (not authenticated)');
        navigate('/login', { replace: true });
        return;
      } else if (user.role !== 'admin') {
        // Logged in but not admin, redirect to home
        console.log('🚨 useScopedAuthRedirect: Redirecting to home (not admin)');
        navigate('/', { replace: true });
        return;
      } else {
        // Admin user, allow access
        console.log('✅ useScopedAuthRedirect: Admin access granted');
        return;
      }
    }
    
    // Handle barber route access
    if (isBarberRoute) {
      if (!user) {
        // Not logged in, redirect to login
        console.log('🚨 useScopedAuthRedirect: Redirecting to login (not authenticated)');
        navigate('/login', { replace: true });
        return;
      } else if (user.role !== 'barber') {
        // Logged in but not barber, redirect to home
        console.log('🚨 useScopedAuthRedirect: Redirecting to home (not barber)');
        navigate('/', { replace: true });
        return;
      } else {
        // Barber user, allow access
        console.log('✅ useScopedAuthRedirect: Barber access granted');
        return;
      }
    }
    
    // Handle login route access for authenticated users
    if (isLoginRoute && user) {
      // Redirect authenticated users to appropriate dashboard
      if (user.role === 'admin') {
        console.log('🚨 useScopedAuthRedirect: Redirecting admin from login to admin dashboard');
        navigate('/admin', { replace: true });
        return;
      } else if (user.role === 'barber') {
        console.log('🚨 useScopedAuthRedirect: Redirecting barber from login to barber dashboard');
        navigate('/barber-admin', { replace: true });
        return;
      } else {
        // Regular customer, redirect to bookings
        console.log('🚨 useScopedAuthRedirect: Redirecting customer from login to bookings');
        navigate('/my-bookings', { replace: true });
        return;
      }
    }

    // TEMPORARILY DISABLED - INFINITE LOOP FIX
    const isHomePage = fullPath === '/' || fullPath === '/#' || fullPath === '/#/';
    if (user && user.role === 'admin' && isHomePage && !isAdminRoute) {
      console.log('🚨 LOOP PREVENTION: Would redirect admin but disabled to stop infinite loop');
      // navigate('/admin', { replace: true });
      // return;
    }
    
    // Handle customer redirects to my-bookings
    const isLanding = fullPath === '/' || fullPath === '/#' || fullPath === '/#/';
    if (user && user.role === 'customer' && isLanding) {
      console.log('🚨 useScopedAuthRedirect: Redirecting customer to my-bookings');
      navigate('/my-bookings', { replace: true });
      return;
    }
    
    console.log('✅ useScopedAuthRedirect: No redirect needed');
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