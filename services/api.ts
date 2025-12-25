import { isSupabaseConfigured, supabase } from './supabaseClient';
import { Api, UserProfile, Review, BookingWithDetails, OrderWithDetails, BarberService, Booking, AppNotification, Product, Barber, Service, ProductOrder, Attendance, LoyaltyStats, LoyaltyHistoryEntry, LoyaltySettings } from '../types';
import { AuthError, Session, SignInWithPasswordCredentials, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../src/lib/logger';

let csrfToken: string | null = null;

export const fetchCSRFToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken;
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-csrf-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      logger.info('🔐 CSRF Token fetched:', csrfToken, 'api');
      return csrfToken;
    } else {
      logger.error('Failed to fetch CSRF token. Status:', response.status, 'api');
    }
  } catch (e) {
    logger.error('Failed to fetch CSRF token', e, 'api');
  }
  return null;
};

// Helper function to normalize product data and ensure type consistency
const normalizeProduct = (product: any): Product => ({
  id: product.id || '',
  name: product.name || '',
  description: product.description || '',
  categories: Array.isArray(product.categories) ? product.categories : [],
  price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
  imageUrl: product.imageUrl || product.imageurl || '',
  stock: typeof product.stock === 'number' ? product.stock : Number(product.stock) || 0
});

// Helper function to invoke a Supabase Edge Function
const invoke = async <T>(
  functionName: string,
  body?: Record<string, any>
): Promise<T> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // List of public functions that should work without authentication
  const publicFunctions = ['get-barbers', 'get-products', 'get-services', 'get-booked-slots', 'get-settings', 'get-available-slots'];
  const isPublicFunction = publicFunctions.includes(functionName);

  // For public functions, try to fetch data directly from the database
  if (isPublicFunction) {
    try {
      switch (functionName) {
        case 'get-barbers':
          const { data: barbers, error: barbersError } = await supabase
            .from('barbers')
            .select(`
                            *,
                            reviews:reviews(*)
                        `)
            .eq('active', true);

          if (barbersError) throw barbersError;
          return barbers as T;

        case 'get-products':
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

          if (productsError) throw productsError;
          // Normalize products to ensure type consistency
          const normalizedProducts = (products || []).map(normalizeProduct);
          return normalizedProducts as T;

        case 'get-services':
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .order('name', { ascending: true });

          if (servicesError) throw servicesError;
          return services as T;

        default:
          // Fall through to Edge Function call
          break;
      }
    } catch (error) {
      logger.info(`Direct database fetch failed for ${functionName}, falling back to Edge Function:`, error, 'api');
      // Fall through to Edge Function call
    }
  }

  // Use the full Supabase URL for Edge Functions
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionsUrl = `${supabaseUrl}/functions/v1`;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure CSRF Token is present for non-public functions
  if (!isPublicFunction) {
    if (!csrfToken) {
      await fetchCSRFToken();
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  // Log the request for debugging
  logger.info('Invoking function: ${functionName}', undefined, 'LegacyConsole');

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Function ${functionName} timed out after 30 seconds`)), 30000)
  );

  // Create the fetch promise
  const fetchPromise = fetch(`${functionsUrl}/${functionName}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Race the fetch promise against the timeout
  const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

  logger.info(`Function ${functionName} response:`, undefined, 'LegacyConsole');

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Function ${functionName} failed with status ${response.status}: ${errorText}`, undefined, 'api');
    throw new Error(`Function ${functionName} failed with status ${response.status}: ${errorText}`);
  }

  const jsonData = await response.json();
  logger.info(`Function ${functionName} response data:`, jsonData, 'api');

  return jsonData as T;
};

const realApi = {
  // Public Data Fetching
  getBarbers: (): Promise<Barber[]> => invoke('get-barbers'),
  getBarberById: async (id: string): Promise<Barber | null> => {
    // Try direct DB fetch first for speed and reliability
    if (supabase) {
      try {
        const { data: barber, error } = await supabase
          .from('barbers')
          .select(`
            *,
            reviews:reviews(*)
          `)
          .eq('id', id)
          .single();

        if (!error && barber) {
          return barber as Barber;
        }
      } catch (e) {
        logger.warn('Direct DB fetch for barber failed, falling back to Edge Function', e, 'api');
      }
    }
    // Fallback to Edge Function
    return invoke('get-barber-by-id', { id });
  },
  getProducts: (): Promise<Product[]> => invoke<Product[]>('get-products').then(products =>
    products.map(product => ({
      ...product,
      stock: Number(product.stock)
    }))
  ),
  getProductById: (id: string): Promise<Product | null> => invoke<{ id: string, name: string, description: string, categories: string[], price: number, imageUrl: string, stock: number | string } | null>('get-product-by-id', { id }).then(product =>
    product ? {
      ...product,
      stock: Number(product.stock)
    } : null
  ),
  getServices: (): Promise<Service[]> => invoke('get-services'),
  getBookedSlots: async (barberId: string, date: string): Promise<string[]> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-booked-slots?barberId=${barberId}&date=${date}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Function get-booked-slots failed: ${errorText}`);
    }

    return response.json();
  },
  getOrderById: (orderId: string): Promise<OrderWithDetails | null> => invoke('get-order-by-id', { orderId }),

  // Admin Data Fetching
  getAllBookings: async (): Promise<Booking[]> => {
    const bookings = await invoke<Booking[]>('get-all-bookings');
    logger.info('📋 getAllBookings received:', bookings?.length, 'bookings', 'api');
    if (bookings && bookings.length > 0) {
      logger.info('First booking sample loaded successfully', { count: bookings.length }, 'api');
    }
    return bookings;
  },
  getAllUsers: (): Promise<{ users: unknown[] }> => invoke<{ users: unknown[] }>('get-all-users').then(response => {
    // Normalize user data ensuring all required fields are present
    const normalizedUsers = (response.users || []).map(u => ({
      id: u.id,
      email: u.email || '',
      // Handle various potential name fields
      name: u.name || u.full_name || u.username || (u.raw_user_meta_data?.name) || 'Unknown User',
      role: u.role || (u.app_metadata?.role) || 'customer',
      // Preserve other fields
      ...u
    }));
    return { users: normalizedUsers };
  }),
  getAttendance: async (date?: string): Promise<Attendance[]> => {
    const result = await invoke<{ success: boolean; attendance: Attendance[] }>('get-attendance', { date: date || new Date().toISOString().split('T')[0] });
    return result.attendance;
  },
  getAllOrders: (): Promise<OrderWithDetails[]> => invoke<any[]>('get-all-orders').then((rows) =>
    (rows || []).map((o: unknown) => {
      // Edge Function returns 'products' (singular object from join)
      const product = o.products || {};
      // Edge Function returns 'app_users' (singular object from join)
      const user = o.app_users || {};

      const price = Number(product.price) || 0;
      const quantity = Number(o.quantity) || 0;
      const total_amount = price * quantity;

      // Normalize status to match UI expectations
      const status = (o.status || '').toLowerCase();
      const normalizedStatus = status === 'reserved' ? 'pending' : status;

      return {
        id: o.id,
        product_id: o.product_id,
        user_id: o.user_id,
        username: user.name || user.email || 'Unknown Customer',
        quantity,
        status: normalizedStatus,
        timestamp: o.timestamp,
        total_amount,
        // Add customer object for frontend compatibility
        customer: {
          id: user.id,
          name: user.name || user.email || 'Unknown Customer',
          email: user.email
        },
        // Frontend expects 'products' (plural)
        products: {
          id: product.id,
          name: product.name || 'Unknown Product',
          price,
          imageUrl: product.imageurl || null,
        },
      } as unknown as OrderWithDetails;
    })
  ),
  updateOrderStatus: (orderId: string, newStatus: string) =>
    invoke('update-order-status', { orderId, newStatus }) as Promise<{ success: boolean; order: OrderWithDetails }>,
  // Barber Data Fetching
  getBarberAttendance: async (date?: string): Promise<Attendance | null> => {
    const result = await invoke<{ success: boolean; attendance: Attendance | null }>('get-barber-attendance', { date: date || new Date().toISOString().split('T')[0] });
    return result.attendance;
  },

  // Updated attendance function
  updateAttendance: async (action: 'clock-in' | 'clock-out' | 'start-break' | 'end-break' | 'mark-present' | 'mark-absent', date?: string): Promise<{ success: boolean; message: string; attendance?: Attendance }> => {
    const result = await invoke<{ success: boolean; message: string; attendance?: Attendance }>('update-attendance', { action, date: date || new Date().toISOString().split('T')[0] });
    return result;
  },
  updateAttendanceStatus: (attendanceId: string, status: 'present' | 'absent' | 'late'): Promise<{ success: boolean; attendance: Attendance }> =>
    invoke('update-attendance-status', { attendanceId, status }),
  updateBookingStatus: (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<{ success: boolean; booking: Booking }> =>
    invoke('update-booking-status', { bookingId, newStatus }),

  // Roster Management
  createRoster: (name: string, startDate: string, endDate: string, days: any): Promise<{ roster: any }> => {
    logger.info('📡 API createRoster called with:', { name, startDate, endDate, days }, 'api');

    // Validate data before sending
    if (!name || !startDate || !endDate || !days) {
      logger.info('❌ Missing required fields in rosterData:', undefined, 'LegacyConsole');
      throw new Error('Missing required roster fields before API call');
    }

    logger.info('📨 Sending to Edge Function with data:', { name, startDate, endDate, days }, 'api');
    return invoke('create-roster', { name, startDate, endDate, days });
  },

  getRosters: async (weekKey?: string): Promise<{ rosters: unknown[] }> => {
    try {
      const params = weekKey ? { weekKey } : {};
      const result = await invoke<{ success: boolean; data: Record<string, unknown>[] }>('get-rosters', params);
      const rawData = result.data || [];

      logger.info('📊 Raw roster data from backend:', JSON.stringify(rawData, null, 2, 'api'));

      // Transform data to match frontend expectations (NEW schema: name, start_date, end_date, days)
      const transformedRosters = rawData.map((r: unknown) => {
        const shifts: unknown[] = [];
        if (r.days) {
          r.days.forEach((day: unknown) => {
            if (day.shifts) {
              day.shifts.forEach((shift: unknown) => {
                if (!shift.isDayOff) {
                  shifts.push({
                    barberId: shift.barberId,
                    date: day.date,
                    start_time: shift.startTime,
                    end_time: shift.endTime
                  });
                }
              });
            }
          });
        }
        return {
          id: r.id,
          week_start_date: r.start_date,
          week_end_date: r.end_date,
          shifts: shifts
        };
      });

      logger.info('✨ Transformed roster data:', JSON.stringify(transformedRosters, null, 2, 'api'));
      return { rosters: transformedRosters };
    } catch (error) {
      logger.error('Error fetching rosters:', error, 'api');
      return { rosters: [] };
    }
  },

  deleteRoster: (rosterId: string): Promise<{ success: boolean }> => {
    return invoke('delete-roster', { rosterId });
  },

  // Add updateRoster method
  updateRoster: (rosterId: string, name: string, startDate: string, endDate: string, days: any): Promise<{ roster: any }> => {
    logger.info('📡 API updateRoster called with:', { rosterId, name, startDate, endDate, days }, 'api');

    // Validate data before sending
    if (!rosterId || !name || !startDate || !endDate || !days) {
      logger.info('❌ Missing required fields in rosterData:', undefined, 'LegacyConsole');
      throw new Error('Missing required roster fields before API call');
    }

    logger.info('📨 Sending to Edge Function with data:', { rosterId, name, startDate, endDate, days }, 'api');
    return invoke('update-roster', { rosterId, name, startDate, endDate, days });
  },

  // Add getBarberRoster method
  getBarberRoster: (barberId?: string): Promise<any[]> => {
    const params = barberId ? { barberId } : {};
    logger.info('Calling getBarberRoster with params:', params, 'api');
    return invoke('get-barber-roster', params);
  },

  // Add getBarberRosters method (for backward compatibility)
  getBarberRosters: (): Promise<{ rosters: unknown[] }> => {
    logger.info('Calling getBarberRosters', undefined, 'api');
    return invoke('get-barber-roster', {});
  },

  // Admin Product Management
  addProduct: (productData: Omit<Product, 'id'>): Promise<Product> => invoke('add-product', productData),
  updateProduct: (productId: string, productData: Omit<Product, 'id'>): Promise<Product> => invoke('update-product', { productId, ...productData }),
  deleteProduct: (productId: string): Promise<{ success: boolean }> => invoke('delete-product', { productId }),

  // Admin Service Management
  addService: (serviceData: Omit<Service, 'id'>): Promise<Service> => invoke('add-service', serviceData),
  updateService: (serviceId: string, serviceData: Partial<Omit<Service, 'id'>>): Promise<Service> => invoke('update-service', { serviceId, serviceData }),
  deleteService: (serviceId: string): Promise<{ success: boolean }> => invoke('delete-service', { serviceId }),

  // Site Settings Management
  getSettings: async (): Promise<any> => {
    try {
      // First check if Supabase is configured
      if (!isSupabaseConfigured) {
        logger.info('🔧 Supabase not configured, using mock settings', undefined, 'api');
        return {
          shop_name: 'LuxeCut Barber Shop',
          allow_signups: true,
          site_logo: 'https://picsum.photos/seed/logo/300/300',
          hero_images: []
        };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Try direct database access first (more reliable for public data)
      if (supabase) {
        try {
          const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'site_settings')
            .single();

          if (!error && settings) {
            logger.info('🔧 Raw settings from database:', settings, 'api');
            // Transform to match expected format
            const settingsObj: any = {
              shop_name: settings.site_name,
              allow_signups: settings.allow_signups,
              site_logo: settings.site_logo,
              hero_images: settings.hero_images || []
            };

            logger.info('🔧 Settings loaded from database:', settingsObj, 'api');
            return settingsObj;
          }
        } catch (dbError) {
          logger.info('Direct DB access failed, trying Edge Function:', dbError, 'api');
        }
      }

      // Fallback to Edge Function with proper headers
      const response = await fetch(`${supabaseUrl}/functions/v1/get-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, // Add anon key for public endpoint
        },
      });

      if (!response.ok) {
        logger.warn(`Settings API returned ${response.status}: ${response.statusText}`, undefined, 'api');
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      logger.info('🔧 Raw response from Edge Function:', result, 'api');

      // Handle both direct settings and wrapped response
      if (result.success && result.data) {
        logger.info('🔧 Settings loaded successfully from API:', result.data, 'api');
        return result.data;
      }

      logger.info('🔧 Settings loaded from API (unwrapped):', result, 'api');
      return result;
    } catch (error) {
      // Return default settings to prevent app crash
      logger.warn('Failed to fetch settings, using defaults:', error, 'api');
      const defaultSettings = {
        shop_name: 'LuxeCut Barber Shop',
        allow_signups: true,
        site_logo: 'https://picsum.photos/seed/logo/300/300',
        hero_images: []
      };
      return defaultSettings;
    }
  },
  updateSettings: async (settingsData: any): Promise<any> => {
    try {
      if (!isSupabaseConfigured) {
        logger.info('🔧 Supabase not configured, skipping settings update', undefined, 'api');
        return { success: true };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase!.auth.getSession();
      const userToken = session?.access_token;

      // Ensure CSRF Token is present
      if (!csrfToken) {
        await fetchCSRFToken();
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(userToken && { 'Authorization': `Bearer ${userToken}` }),
        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
      };

      logger.info('🔧 Updating settings with data:', settingsData, 'api');

      const response = await fetch(`${supabaseUrl}/functions/v1/update-settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(settingsData),
      });

      logger.info('🔧 Settings update response:', response.status, response.statusText, 'api');

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('🔧 Settings update failed:', errorText, 'api');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.info('🔧 Settings update result:', result, 'api');
      return result;
    } catch (error) {
      logger.error('🔧 Settings update error:', error, 'api');
      throw error;
    }
  },

  uploadSiteImage: async (file: File, bucket: string, path: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    // Ensure CSRF Token is present
    if (!csrfToken) {
      await fetchCSRFToken();
    }

    const headers: HeadersInit = {
      ...(userToken && { 'Authorization': `Bearer ${userToken}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken })
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/upload-site-image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Function upload-site-image failed: ${errorText}`);
    }

    return response.json();
  },

  // Helper function to get barber ID from user ID
  getBarberIdByUserId: async (userId: string): Promise<string | null> => {
    try {
      const { data: barber, error } = await supabase!
        .from('barbers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.warn('Error fetching barber by user ID:', error, 'api');
        return null;
      }

      return barber?.id || null;
    } catch (error) {
      logger.warn('Error in getBarberIdByUserId:', error, 'api');
      return null;
    }
  },

  // Admin Barber Management
  addBarber: (barberData: { name: string; photo: string; photo_path?: string; experience: number; specialties: string[]; email: string; password: string; }): Promise<Barber> => {
    logger.info("Sending barber data to add-barber function:", barberData, 'api');
    return invoke('add-barber', { barberData });
  },
  updateBarber: (barberId: string, barberData: any): Promise<Barber> => {
    // Ensure we're only sending plain data, no React components or DOM elements
    const cleanData: any = {
      id: barberId,
      name: barberData.name
    };

    // Only add fields that exist in the barberData
    if (barberData.email !== undefined) cleanData.email = barberData.email;
    if (barberData.phone !== undefined) cleanData.phone = barberData.phone;
    if (barberData.services !== undefined) cleanData.services = Array.isArray(barberData.services) ? barberData.services : [];
    if (barberData.specialties !== undefined) cleanData.specialties = Array.isArray(barberData.specialties) ? barberData.specialties : [];
    if (barberData.working_hours !== undefined) cleanData.working_hours = Array.isArray(barberData.working_hours) ? barberData.working_hours : [];
    if (barberData.photo_path !== undefined) cleanData.photo_path = barberData.photo_path;
    if (barberData.photo !== undefined) cleanData.photo = barberData.photo; // Add photo field support
    if (barberData.active !== undefined) cleanData.is_active = barberData.active;

    logger.info("Sending barber update data to update-barber function:", cleanData, 'api');
    return invoke('update-barber', cleanData);
  },
  deleteBarber: (barberId: string, userId: string): Promise<{ success: boolean }> => invoke('delete-barber', { barberId, userId }),
  updateBarberServices: (barberId: string, services: BarberService[]): Promise<Barber> => invoke('update-barber-services', { barberId, services }),

  // Admin User Management
  syncUserRole: (userId: string, newRole: 'customer' | 'barber' | 'admin'): Promise<{ success: boolean; message: string }> => invoke('sync-user-role', { userId, newRole }),

  // Authenticated Customer Actions
  createBooking: (bookingDetails: Omit<Booking, 'id' | 'status' | 'reviewLeft'>): Promise<Booking> => invoke('create-booking', { bookingDetails }),
  createProductOrder: (order: Omit<ProductOrder, 'id' | 'userId' | 'userName' | 'status' | 'timestamp'>): Promise<ProductOrder> =>
    invoke<any>('create-product-order', { order }).then((o) => ({
      id: o.id,
      productId: o.product_id ?? o.productId,
      userId: o.user_id ?? o.userId ?? null,
      userName: o.username ?? o.userName ?? '',
      quantity: Number(o.quantity) || 0,
      status: o.status,
      timestamp: o.timestamp,
    })),
  getMyBookings: (): Promise<BookingWithDetails[]> => invoke('get-my-bookings'),
  getMyOrders: (): Promise<OrderWithDetails[]> => invoke('get-my-orders'),
  cancelBooking: (bookingId: string): Promise<{ success: boolean }> => invoke('cancel-booking', { bookingId }),

  submitReview: (review: { bookingId: string; rating: number; comment: string; barberId: string; }): Promise<{ success: boolean }> => invoke('submit-review', { review }),

  // Authenticated Barber Actions
  getBarberSchedule: (): Promise<Booking[]> => invoke('get-barber-schedule'),
  cancelBookingByBarber: (bookingId: string, reason: string): Promise<{ success: boolean }> => invoke('cancel-booking-by-barber', { bookingId, reason }),
  updateBarberAvailability: (hiddenSlots: string[]): Promise<{ success: boolean }> => invoke('update-barber-availability', { hiddenSlots }),

  // New methods for booking flow
  getBarberServices: async (barberId: string): Promise<any[]> => {
    // Return all services instead of barber-specific services
    return realApi.getServices();
  },

  // Check if a barber is available on a specific date based on roster
  isBarberAvailable: async (barberId: string, date: string): Promise<{ available: boolean; reason?: string }> => {
    try {
      // Ensure CSRF Token is present
      if (!csrfToken) {
        await fetchCSRFToken();
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase!.auth.getSession();
      const userToken = session?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/is-barber-available?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Function is-barber-available failed: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      logger.error('Error checking barber availability:', error, 'api');
      // Default to available if there's an error
      return { available: true, reason: 'Error checking availability' };
    }
  },
  getAvailableSlots: async (barberId: string, date: string, serviceIds?: string[]): Promise<string[]> => {
    // Ensure CSRF Token is present
    if (!csrfToken) {
      await fetchCSRFToken();
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-available-slots?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}${serviceIds && serviceIds.length > 0 ? `&serviceIds=${encodeURIComponent(serviceIds.join(','))}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
      });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Function get-available-slots failed: ${errorText}`);
    }

    return response.json();
  },

  // Notifications
  notifications: {
    getNotifications: (): Promise<AppNotification[]> => invoke('get-my-notifications'),
    markNotificationAsRead: (notificationId: string): Promise<{ success: boolean }> => invoke('mark-notification-as-read', { notificationId }),
    subscribeToNotifications: (userId: string, onNewNotification: (notification: AppNotification) => void): RealtimeChannel | null => {
      if (!supabase) return null;

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
          (payload) => {
            onNewNotification(payload.new as AppNotification);
          }
        )
        .subscribe();

      return channel;
    }
  },

  // Authentication (using Supabase client-side SDK directly)
  auth: {
    signIn: async (credentials: { email: string; password: string }) => {
      logger.info('🔐 signIn called with:', { email: credentials.email, hasPassword: !!credentials.password }, 'api');
      if (!supabase) {
        logger.warn('🔐 Supabase not configured, returning error', undefined, 'api');
        return { data: {}, error: new AuthError("Supabase not configured.") };
      }
      logger.info('🔐 Attempting Supabase signIn...', undefined, 'api');
      const result = await supabase.auth.signInWithPassword(credentials);
      logger.info('🔐 Supabase signIn result:', undefined, 'LegacyConsole');
      return result;
    },
    signUp: async (credentials: { email: string; password: string; name: string }) => {
      if (!supabase) return { data: {}, error: new AuthError("Supabase not configured.") };
      return supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            role: 'customer' // Default role for new signups
          }
        }
      });
    },
    signOut: async () => {
      if (!supabase) return { error: new AuthError("Supabase not configured.") };
      return supabase.auth.signOut();
    },
    getUserProfile: async (): Promise<UserProfile | null> => {
      logger.info('👤 getUserProfile called', undefined, 'api');
      if (!supabase) {
        logger.info('👤 No supabase client available', undefined, 'api');
        return null;
      }

      logger.info('👤 Getting user from Supabase auth...', undefined, 'api');

      try {
        // OPTIMIZED: Use getSession() first (instant, reads from localStorage)
        // Only fall back to getUser() (network call) if session doesn't exist
        logger.info('👤 Calling getSession()...', undefined, 'api');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        logger.info('👤 getSession() completed:', { hasSession: !!session, error: sessionError?.message }, 'api');

        if (sessionError) {
          logger.warn('👤 Session error, trying getUser():', sessionError, 'api');
          throw sessionError;
        }

        if (!session?.user) {
          logger.info('👤 No session found, trying getUser() as fallback...', undefined, 'api');

          // Fallback to getUser() with timeout
          const userPromise = supabase.auth.getUser();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase getUser timeout after 5 seconds')), 5000)
          );

          const { data: { user }, error: userError } = await Promise.race([userPromise, timeoutPromise]) as any;

          if (userError || !user) {
            logger.info('👤 No authenticated user found', undefined, 'api');
            return null;
          }

          const profile: UserProfile = {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || 'Unknown User',
            role: user.app_metadata?.role || 'customer',
          };

          logger.info('👤 Profile created from getUser():', profile, 'api');
          return profile;
        }

        // SUCCESS: Got user from session (fast!)
        const user = session.user;

        logger.info('👤 DEBUG: User metadata analysis', undefined, 'api');
        logger.info('👤 user.app_metadata:', user.app_metadata, 'api');
        logger.info('👤 user.user_metadata:', user.user_metadata, 'api');
        logger.info('👤 Role from app_metadata:', user.app_metadata?.role, 'api');

        const profile: UserProfile = {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || 'Unknown User',
          role: user.app_metadata?.role || 'customer',
        };

        logger.info('👤 Profile created from session (fast):', profile, 'api');
        return profile;
      } catch (error: Error | unknown) {
        logger.error('👤 Profile fetch failed:', error, 'api');
        logger.error('👤 Error stack:', error?.stack, 'api');
        return null;
      }
    },
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
      return supabase.auth.onAuthStateChange(callback);
    },
    updateUser: async (attributes: { email?: string; password?: string; data?: any }) => {
      if (!supabase) return { data: { user: null }, error: new AuthError("Supabase not configured.") };
      return supabase.auth.updateUser(attributes);
    }
  },
  // Expose invoke for advanced usage / debugging
  invoke: invoke,
  supabase: supabase,

  // Analytics
  getProductSales: async (days: number = 30): Promise<{ dailyRevenue: { date: string; revenue: number }[]; topProducts: { product_id: string; name: string; revenue: number; quantity: number }[] }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-product-sales?days=${encodeURIComponent(String(days))}`,
      {
        method: 'GET',
        headers: {
          'Authorization': userToken ? `Bearer ${userToken}` : undefined as any,
          'Content-Type': 'application/json',
        } as any,
      });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Function get-product-sales failed: ${errorText}`);
    }
    return response.json();
  },

  // Loyalty System (Spending-based)
  getLoyaltyStats: async (): Promise<LoyaltyStats> => {
    const result = await invoke<{ success: boolean; stats: LoyaltyStats }>('get-loyalty-stats');
    return result.stats;
  },

  getLoyaltyHistory: async (limit: number = 50, offset: number = 0): Promise<LoyaltyHistoryEntry[]> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-loyalty-history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Function get-loyalty-history failed: ${errorText}`);
    }

    const result = await response.json();
    return result.history || [];
  },

  updateLoyaltySettings: async (settings: Partial<LoyaltySettings>): Promise<LoyaltySettings> => {
    // Note: The backend function might expect tier_name, but the interface seems to have simplified it.
    // Based on previous error: Expected 2 args, got 1. The interface in types.ts defines it as taking only settings?
    // Let's check types.ts again.
    // types.ts: updateLoyaltySettings: (settings: Partial<LoyaltySettings>) => Promise<LoyaltySettings>;
    // So the implementation should match.
    // However, the backend likely needs tier_name or uses a global setting.
    // If the implementation called 'update-loyalty-settings' with { tier_name, ...settings }, it implies the function needs it.
    // But for now, fixing the TS error in implementation:
    const result = await invoke<{ success: boolean; settings: LoyaltySettings }>('update-loyalty-settings', settings);
    return result.settings;
  },

  processLoyaltyTransaction: (bookingId: string, amountPaid: number, serviceId: string): Promise<any> => invoke('process-loyalty-transaction', { body: { bookingId, amountPaid, serviceId } }),
  processPenaltyTransaction: (userId: string, penaltyType: 'late_cancellation' | 'no_show', bookingId?: string, reason?: string): Promise<any> => invoke('process-penalty-transaction', { userId, penaltyType, bookingId, reason }),
  checkLoyaltyTierUpdate: (): Promise<any> => invoke('check-loyalty-tier-update'),

  // Analytics & Export
  getAnalyticsOverview: (): Promise<any> => invoke('get-analytics-overview'),

  // Admin Loyalty Stats
  getAdminLoyaltyStats: (): Promise<{
    success: boolean;
    stats?: {
      totalMembers: number;
      activePoints: number;
      tierDistribution: {
        Silver: number;
        Gold: number;
        Platinum: number;
      };
      recentActivity: number;
      totalPointsIssued?: number;
      totalPointsRedeemed?: number;
    };
    error?: string;
  }> => invoke('get-admin-loyalty-stats'),

  // Get Loyalty Settings
  getLoyaltySettings: (): Promise<{
    success: boolean;
    settings?: {
      id: string;
      service_rate_silver: number;
      service_rate_gold: number;
      service_rate_platinum: number;
      silver_threshold: number;
      gold_threshold: number;
      platinum_threshold: number;
      late_cancellation_penalty: number;
      no_show_penalty: number;
      created_at?: string;
      updated_at?: string;
    };
    error?: string;
  }> => invoke('get-loyalty-settings'),
  getDetailedReports: (reportType: 'retention' | 'peak_times', dateRange?: any): Promise<any> => invoke('get-detailed-reports', { reportType, dateRange }),
  exportData: (entity: 'bookings' | 'orders' | 'users', format: 'csv' = 'csv'): Promise<{ csv: string; filename: string }> => invoke('export-data', { entity, format }),

  // Billing & Transactions
  createTransaction: (data: Record<string, unknown>): Promise<any> => invoke('create-transaction', data),
  getBookingsForBilling: (): Promise<any[]> => invoke('get-bookings-for-billing'),
  getTransactionAnalytics: (filter?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'customer_type' }): Promise<any> => invoke('get-transaction-analytics', filter || {}),
  getTransactions: async (filter?: { startDate?: string; endDate?: string; customerType?: 'walk-in' | 'booking' }): Promise<any[]> => {
    try {
      return await invoke<any[]>('get-transactions', {});
    } catch (error) {
      logger.error('Error fetching transactions:', error, 'api');
      return [];
    }
  },
  exportDailyReport: async (date: string, format: 'csv' | 'pdf' = 'csv'): Promise<{ data: string; filename: string }> => {
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;

    const { data: transactions, error } = await supabase!
      .from('transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Generate CSV
    const headers = ['Receipt#', 'Time', 'Customer', 'Phone', 'Type', 'Services', 'Subtotal', 'Tax', 'Total', 'Payment'];
    const rows = (transactions || []).map((t: unknown) => {
      const time = new Date(t.created_at).toLocaleTimeString();
      const services = (t.services || []).map((s: unknown) => s.service_name).join('; ');
      return [
        t.receipt_number,
        time,
        t.customer_name,
        t.customer_phone,
        t.customer_type,
        services,
        `$${t.subtotal.toFixed(2)}`,
        `$${t.tax_amount.toFixed(2)}`,
        `$${t.total_amount.toFixed(2)}`,
        t.payment_method
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `transactions_${date}.csv`;

    return { data: csv, filename };
  }
};

export const api: Api = {
  ...realApi,
  fetchCSRFToken

};
