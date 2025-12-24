/**
 * Authentication API Module
 * Consolidated authentication and user management operations
 */

import { supabase } from './supabaseClient';
import { logger } from '../src/lib/logger';
import { performanceMonitor } from '../src/lib/performance';
import { security } from '../src/lib/security';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'barber' | 'admin';
  createdAt: string;
  updatedAt: string;
  preferences?: Record<string, unknown>;
}

export interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  role?: 'customer' | 'barber';
}

export interface AuthResult {
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: { message: string };
}

export class AuthApi {
  private readonly sessionKey = 'luxecut_session';
  private readonly refreshTokenKey = 'luxecut_refresh_token';

  /**
   * Sign in user with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    const startTime = performance.now();
    
    try {
      logger.info('User sign in attempt', { 
        email: credentials.email,
        remember: credentials.remember 
      }, 'AuthApi');

      // Initialize CSRF protection for new session
      const csrfToken = await security.initializeCSRFProtection();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/signin', duration, error ? 401 : 200);

      if (error) {
        logger.warn('Sign in failed', { 
          email: credentials.email, 
          error: error.message 
        }, 'AuthApi');
        
        return {
          error: { message: error.message }
        };
      }

      // Get user profile
      const profile = await this.getUserProfile();
      
      // Handle "remember me" functionality
      if (credentials.remember) {
        this.setRememberMeSession(data.session!);
      }

      logger.info('Sign in successful', { 
        userId: data.user?.id,
        email: credentials.email,
        role: profile?.role,
        duration
      }, 'AuthApi');

      return {
        user: profile,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresIn: data.session?.expires_in
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/signin', duration, 500);
      
      logger.error('Sign in error', error, 'AuthApi');
      return {
        error: { message: 'An unexpected error occurred during sign in' }
      };
    }
  }

  /**
   * Sign up new user
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    const startTime = performance.now();
    
    try {
      logger.info('User sign up attempt', { 
        email: credentials.email,
        name: credentials.name,
        role: credentials.role || 'customer'
      }, 'AuthApi');

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            role: credentials.role || 'customer'
          }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/signup', duration, error ? 400 : 201);

      if (error) {
        logger.warn('Sign up failed', { 
          email: credentials.email, 
          error: error.message 
        }, 'AuthApi');
        
        return {
          error: { message: error.message }
        };
      }

      // For email confirmation flow, user won't be automatically signed in
      if (data.user && !data.session) {
        logger.info('Sign up successful - email confirmation required', { 
          userId: data.user.id,
          email: credentials.email
        }, 'AuthApi');

        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: credentials.name,
            role: credentials.role || 'customer',
            createdAt: data.user.created_at,
            updatedAt: data.user.updated_at || data.user.created_at
          }
        };
      }

      // If auto-signed in, get full profile
      const profile = await this.getUserProfile();

      logger.info('Sign up and sign in successful', { 
        userId: data.user?.id,
        email: credentials.email,
        role: profile?.role,
        duration
      }, 'AuthApi');

      return {
        user: profile,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresIn: data.session?.expires_in
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/signup', duration, 500);
      
      logger.error('Sign up error', error, 'AuthApi');
      return {
        error: { message: 'An unexpected error occurred during sign up' }
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error?: { message: string } }> {
    const startTime = performance.now();
    
    try {
      logger.info('User sign out', undefined, 'AuthApi');

      const { error } = await supabase.auth.signOut();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/signout', duration, error ? 500 : 200);

      // Clear local session data
      this.clearLocalSession();

      if (error) {
        logger.error('Sign out failed', error, 'AuthApi');
        return {
          error: { message: error.message }
        };
      }

      logger.info('Sign out successful', { duration }, 'AuthApi');
      return {};

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/signout', duration, 500);
      
      logger.error('Sign out error', error, 'AuthApi');
      return {
        error: { message: 'An unexpected error occurred during sign out' }
      };
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const startTime = performance.now();
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      // Get extended profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', user.id)
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/profile', duration, profileError ? 404 : 200);

      if (profileError) {
        // Fallback to auth metadata if profile not found
        logger.warn('Profile not found, using fallback', { 
          userId: user.id,
          error: profileError.message 
        }, 'AuthApi');

        return {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || 'Unknown User',
          role: user.user_metadata?.role || 'customer',
          createdAt: user.created_at,
          updatedAt: user.updated_at || user.created_at
        };
      }

      logger.debug('User profile loaded', { 
        userId: profile.id,
        role: profile.role,
        duration 
      }, 'AuthApi');

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        preferences: profile.preferences
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/profile', duration, 500);
      
      logger.error('Get profile error', error, 'AuthApi');
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'preferences'>>): Promise<UserProfile> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating user profile', { updates }, 'AuthApi');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('app_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/profile/update', duration, error ? 500 : 200);

      if (error) {
        logger.error('Profile update failed', error, 'AuthApi');
        throw new Error(error.message || 'Failed to update profile');
      }

      logger.info('Profile updated successfully', { 
        userId: user.id,
        duration 
      }, 'AuthApi');

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        preferences: data.preferences
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/profile/update', duration, 500);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.auth.refreshSession();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/refresh', duration, error ? 401 : 200);

      if (error) {
        logger.warn('Token refresh failed', { error: error.message }, 'AuthApi');
        return {
          error: { message: error.message }
        };
      }

      logger.debug('Token refreshed successfully', { duration }, 'AuthApi');

      return {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresIn: data.session?.expires_in
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/refresh', duration, 500);
      
      logger.error('Token refresh error', error, 'AuthApi');
      return {
        error: { message: 'Failed to refresh token' }
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ error?: { message: string } }> {
    const startTime = performance.now();
    
    try {
      logger.info('Password change attempt', undefined, 'AuthApi');

      // First verify current password by attempting sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      const verifyResult = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyResult.error) {
        return {
          error: { message: 'Current password is incorrect' }
        };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/change-password', duration, error ? 400 : 200);

      if (error) {
        logger.warn('Password change failed', { error: error.message }, 'AuthApi');
        return {
          error: { message: error.message }
        };
      }

      logger.info('Password changed successfully', { 
        userId: user.id,
        duration 
      }, 'AuthApi');

      return {};

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/change-password', duration, 500);
      
      logger.error('Password change error', error, 'AuthApi');
      return {
        error: { message: 'Failed to change password' }
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ error?: { message: string } }> {
    const startTime = performance.now();
    
    try {
      logger.info('Password reset requested', { email }, 'AuthApi');

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/reset-password', duration, error ? 400 : 200);

      if (error) {
        logger.warn('Password reset failed', { email, error: error.message }, 'AuthApi');
        return {
          error: { message: error.message }
        };
      }

      logger.info('Password reset email sent', { email, duration }, 'AuthApi');
      return {};

    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/auth/reset-password', duration, 500);
      
      logger.error('Password reset error', error, 'AuthApi');
      return {
        error: { message: 'Failed to send password reset email' }
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state changed', { event, hasSession: !!session }, 'AuthApi');
      callback(event, session);
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return !error && !!user;
    } catch {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return error ? null : session;
    } catch {
      return null;
    }
  }

  /**
   * Private: Handle "remember me" session storage
   */
  private setRememberMeSession(session: any): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.sessionKey, JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          remember: true
        }));
      }
    } catch (error) {
      logger.warn('Failed to save remember me session', error, 'AuthApi');
    }
  }

  /**
   * Private: Clear local session data
   */
  private clearLocalSession(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.refreshTokenKey);
      }
    } catch (error) {
      logger.warn('Failed to clear local session', error, 'AuthApi');
    }
  }

  /**
   * Validate sign in credentials
   */
  validateSignInCredentials(credentials: SignInCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.push('Valid email is required');
    }

    if (!credentials.password || credentials.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate sign up credentials
   */
  validateSignUpCredentials(credentials: SignUpCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.push('Valid email is required');
    }

    if (!credentials.password || credentials.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(credentials.password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (!credentials.name || credentials.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const authApi = new AuthApi();
export default authApi;