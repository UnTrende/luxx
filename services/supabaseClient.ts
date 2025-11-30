import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase is now ENABLED ---
// The application is configured to connect to a real Supabase backend.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Custom storage implementation that handles quota exceeded errors
 */
const createSafeStorage = () => {
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn(`Failed to get item from localStorage: ${key}`, error);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.message?.includes('QuotaExceededError') || error.message?.includes('exceeded the quota')) {
          console.warn('LocalStorage quota exceeded, attempting to clear space...');

          // Try to clear non-essential items AND fix large auth tokens
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('cache_') || key.startsWith('temp_') || key.includes('log') || key.includes('debug'))) {
                keysToRemove.push(key);
              }

              // Also check for old auth tokens that might contain large base64 images
              if (key && key.includes('auth-token')) {
                try {
                  const tokenData = localStorage.getItem(key);
                  if (tokenData && tokenData.length > 50000) { // If token is unusually large (>50KB)
                    console.warn(`Removing large auth token: ${key} (${Math.round(tokenData.length / 1024)}KB)`);
                    keysToRemove.push(key);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }

            // Remove the identified keys
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Try again
            localStorage.setItem(key, value);
            console.log('Successfully stored item after clearing space');
          } catch (retryError) {
            console.error('Failed to store item even after clearing space:', retryError);

            // Last resort: Clear ALL localStorage except the current key we're trying to set
            console.warn('Last resort: clearing all localStorage');
            try {
              localStorage.clear();
              localStorage.setItem(key, value);
              console.log('Successfully stored after full clear');
            } catch (finalError) {
              throw new Error('Storage quota exceeded. Please clear your browser cache or use incognito mode.');
            }
          }
        } else {
          throw error;
        }
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove item from localStorage: ${key}`, error);
      }
    },
  };
};

/**
 * A flag to check if the Supabase environment variables are set.
 * This will be true if the variables are correctly configured in the environment.
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * The Supabase client instance.
 * It will be null if the environment variables are not set, allowing for graceful degradation.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: createSafeStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  : null;
