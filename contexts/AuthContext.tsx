import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
// FIX: Replaced deprecated UserCredentials with SignInWithPasswordCredentials
import { AuthError, Session, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { logger } from '../src/lib/logger';

interface AuthContextType {
  user: UserProfile | null;
  role: string | null;
  isLoading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: { email: string; password: string; name: string }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track current user ID to prevent unnecessary re-fetches on token refresh
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await api.auth.getUserProfile();
        if (profile) {
          currentUserIdRef.current = profile.id;
        }
        setUser(profile);
      } catch (error) {
        logger.error("Error fetching initial user profile", error, 'AuthContext');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    const { data: authListener } = api.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state changed', { event, hasSession: !!session }, 'AuthContext');

        // Skip processing for token refresh events - user is already authenticated
        // This is the KEY FIX for tab switching issue
        if (event === 'TOKEN_REFRESHED') {
          logger.debug('Token refreshed, skipping profile reload', undefined, 'AuthContext');
          return;
        }

        // Skip if user ID hasn't changed (prevents reload on INITIAL_SESSION after login)
        const sessionUserId = session?.user?.id || null;
        if (sessionUserId && sessionUserId === currentUserIdRef.current) {
          logger.debug('Same user, skipping redundant profile fetch', { userId: sessionUserId }, 'AuthContext');
          return;
        }

        // Only show loading for actual auth state changes
        const isActualAuthChange = event === 'SIGNED_IN' || event === 'SIGNED_OUT';
        if (isActualAuthChange) {
          setIsLoading(true);
        }

        if (event === 'SIGNED_IN' && session) {
          logger.info('User signed in, fetching profile', undefined, 'AuthContext');
          try {
            logger.debug('Calling api.auth.getUserProfile', {
              apiAuthType: typeof api.auth,
              getUserProfileType: typeof api.auth.getUserProfile
            }, 'AuthContext');

            // Add timeout to prevent hanging
            const profilePromise = api.auth.getUserProfile();
            const timeoutPromise = new Promise<UserProfile | null>((_, reject) =>
              setTimeout(() => reject(new Error('getUserProfile timeout after 10 seconds')), 10000)
            );

            const profile = await Promise.race([profilePromise, timeoutPromise]);
            logger.info('Profile fetched successfully', {
              profileExists: profile ? 'exists' : 'null',
              role: profile?.role
            }, 'AuthContext');

            if (profile) {
              currentUserIdRef.current = profile.id;
              setUser(profile);
            } else {
              // If profile is null, use fallback
              throw new Error('Profile returned null');
            }
          } catch (profileError) {
            logger.error('Profile fetch failed', profileError, 'AuthContext');

            // Use session metadata as fallback - more reliable than hardcoding 'customer'
            const fallbackRole = session.user.app_metadata?.role ||
              session.user.user_metadata?.role ||
              'customer';

            logger.info('Creating fallback profile', { fallbackRole }, 'AuthContext');
            currentUserIdRef.current = session.user.id;
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || 'User',
              role: fallbackRole
            });
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logger.info('User signed out', undefined, 'AuthContext');
          currentUserIdRef.current = null;
          setUser(null);
          setIsLoading(false);
        }
        // Note: For other events (INITIAL_SESSION, etc.), we don't change loading state
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: { email: string; password: string }) => {
    logger.info('AuthContext signIn called', undefined, 'AuthContext');
    try {
      setIsLoading(true);
      const { error } = await api.auth.signIn(credentials);
      logger.info('AuthContext signIn result', { errorMessage: error?.message }, 'AuthContext');
      // User state will be updated by onAuthStateChange listener
      return { error };
    } catch (err: unknown) {
      // Handle quota exceeded error specifically
      const error = err as Error;
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('QuotaExceededError') || error?.message?.includes('exceeded the quota')) {
        logger.error('Storage quota exceeded', err, 'AuthContext');
        // Try to clear more storage space
        try {
          // Clear old cache data more aggressively
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('cache_') || key.startsWith('temp_') || key.includes('log') || key.includes('debug'))) {
              keysToRemove.push(key);
            }
          }

          // Remove the identified keys
          keysToRemove.forEach(key => localStorage.removeItem(key));

          // Also try to clear session storage
          sessionStorage.clear();

          // Retry the sign in
          const { error } = await api.auth.signIn(credentials);
          return { error };
        } catch (retryError) {
          logger.error('SignIn retry failed', retryError, 'AuthContext');
          return { error: new Error('Storage quota exceeded. Please follow these steps: 1) Press F12 to open DevTools, 2) Go to Application/Storage tab, 3) Click "Clear storage" or run "localStorage.clear()" in the console, 4) Refresh the page and try again.') };
        }
      }
      logger.error('AuthContext signIn caught error', err, 'AuthContext');
      return { error: err as AuthError };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (credentials: { email: string; password: string; name: string }) => {
    const { error } = await api.auth.signUp(credentials);
    // User state will be updated by onAuthStateChange listener
    return { error };
  };

  const signOut = async () => {
    const { error } = await api.auth.signOut();
    // User state will be updated by onAuthStateChange listener
    return { error };
  };

  const value = {
    user,
    role: user?.role || null,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  // Always render children, but the app components should handle isLoading state
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};