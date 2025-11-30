import { isSupabaseConfigured, supabase } from './supabaseClient';
import { Api, UserProfile, Review, BookingWithDetails, OrderWithDetails, BarberService, Booking, AppNotification, Product, Barber, Service, ProductOrder, Attendance } from '../types';
import { AuthError, Session, SignInWithPasswordCredentials, RealtimeChannel } from '@supabase/supabase-js';

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
const invoke = async <T>(functionName: string, body?: object): Promise<T> => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Cannot invoke function.");
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
      console.log(`Direct database fetch failed for ${functionName}, falling back to Edge Function:`, error);
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

  // Log the request for debugging
  console.log(`Invoking function: ${functionName}`, {
    url: `${functionsUrl}/${functionName}`,
    headers,
    body
  });

  const response = await fetch(`${functionsUrl}/${functionName}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`Function ${functionName} response:`, {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Function ${functionName} failed with status ${response.status}: ${errorText}`);
    throw new Error(`Function ${functionName} failed with status ${response.status}: ${errorText}`);
  }

  const jsonData = await response.json();
  console.log(`Function ${functionName} response data:`, jsonData);

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
        console.warn('Direct DB fetch for barber failed, falling back to Edge Function', e);
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
  getAllBookings: (): Promise<Booking[]> => invoke('get-all-bookings'),
  getAllUsers: (): Promise<{ users: any[] }> => invoke('get-all-users'),
  getAttendance: async (date?: string): Promise<Attendance[]> => {
    const result = await invoke<{ success: boolean; attendance: Attendance[] }>('get-attendance', { date: date || new Date().toISOString().split('T')[0] });
    return result.attendance;
  },
  getAllOrders: (): Promise<OrderWithDetails[]> => invoke<any[]>('get-all-orders').then((rows) =>
    (rows || []).map((o: any) => {
      const product = o.product || {};
      const price = Number(product.price) || 0;
      const quantity = Number(o.quantity) || 0;
      const total_amount = price * quantity;
      // Normalize status to match UI expectations
      const status = (o.status || '').toLowerCase();
      const normalizedStatus = status === 'reserved' ? 'pending' : status;
      return {
        id: o.id,
        product_id: o.product_id,
        user_id: o.user_id || o.customer?.id || null,
        username: o.username || o.customer?.user_metadata?.name || o.customer?.email || 'Customer',
        quantity,
        status: normalizedStatus,
        timestamp: o.timestamp || o.created_at,
        total_amount,
        product: {
          id: product.id,
          name: product.name,
          price,
          imageUrl: product.imageUrl || product.imageurl || null,
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
    console.log('📡 API createRoster called with:', { name, startDate, endDate, days });

    // Validate data before sending
    if (!name || !startDate || !endDate || !days) {
      console.error('❌ Missing required fields in rosterData:', {
        name: name,
        startDate: startDate,
        endDate: endDate,
        days: days
      });
      throw new Error('Missing required roster fields before API call');
    }

    console.log('📨 Sending to Edge Function with data:', { name, startDate, endDate, days });
    return invoke('create-roster', { name, startDate, endDate, days });
  },

  getRosters: async (weekKey?: string): Promise<{ rosters: any[] }> => {
    try {
      const params = weekKey ? { weekKey } : {};
      const result = await invoke<{ success: boolean; data: any[] }>('get-rosters', params);
      const rawData = result.data || [];

      console.log('📊 Raw roster data from backend:', JSON.stringify(rawData, null, 2));

      // Transform data to match frontend expectations (NEW schema: name, start_date, end_date, days)
      const transformedRosters = rawData.map((r: any) => {
        const shifts: any[] = [];
        if (r.days) {
          r.days.forEach((day: any) => {
            if (day.shifts) {
              day.shifts.forEach((shift: any) => {
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

      console.log('✨ Transformed roster data:', JSON.stringify(transformedRosters, null, 2));
      return { rosters: transformedRosters };
    } catch (error) {
      console.error('Error fetching rosters:', error);
      return { rosters: [] };
    }
  },

  deleteRoster: (rosterId: string): Promise<{ success: boolean }> => {
    return invoke('delete-roster', { rosterId });
  },

  // Add updateRoster method
  updateRoster: (rosterId: string, name: string, startDate: string, endDate: string, days: any): Promise<{ roster: any }> => {
    console.log('📡 API updateRoster called with:', { rosterId, name, startDate, endDate, days });

    // Validate data before sending
    if (!rosterId || !name || !startDate || !endDate || !days) {
      console.error('❌ Missing required fields in rosterData:', {
        rosterId: rosterId,
        name: name,
        startDate: startDate,
        endDate: endDate,
        days: days
      });
      throw new Error('Missing required roster fields before API call');
    }

    console.log('📨 Sending to Edge Function with data:', { rosterId, name, startDate, endDate, days });
    return invoke('update-roster', { rosterId, name, startDate, endDate, days });
  },

  // Add getBarberRoster method
  getBarberRoster: (barberId?: string): Promise<any[]> => {
    const params = barberId ? { barberId } : {};
    console.log('Calling getBarberRoster with params:', params);
    return invoke('get-barber-roster', params);
  },

  // Add getBarberRosters method (for backward compatibility)
  getBarberRosters: (): Promise<{ rosters: any[] }> => {
    console.log('Calling getBarberRosters');
    return invoke('get-barber-roster', {});
  },

  // Admin Product Management
  addProduct: (productData: Omit<Product, 'id'>): Promise<Product> => invoke('add-product', productData),
  updateProduct: (productId: string, productData: Omit<Product, 'id'>): Promise<Product> => invoke('update-product', { productId, ...productData }),
  deleteProduct: (productId: string): Promise<{ success: boolean }> => invoke('delete-product', { productId }),

  // Admin Service Management
  addService: (serviceData: Omit<Service, 'id'>): Promise<Service> => invoke('add-service', serviceData),
  updateService: (serviceId: string, serviceData: Partial<Omit<Service, 'id'>>): Promise<Service> => invoke('update-service', { serviceId, ...serviceData }),
  deleteService: (serviceId: string): Promise<{ success: boolean }> => invoke('delete-service', { serviceId }),

  // Site Settings Management
  getSettings: async (): Promise<any> => {
    try {
      // First check if Supabase is configured
      if (!isSupabaseConfigured) {
        console.log('🔧 Supabase not configured, using mock settings');
        return {
          shop_name: 'LuxeCut Barber Shop',
          allow_signups: true,
          site_logo: 'https://picsum.photos/seed/logo/300/300'
        };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Try direct database access first (more reliable for public data)
      if (supabase) {
        try {
          const { data: settings, error } = await supabase
            .from('site_settings')
            .select('*');

          if (!error && settings) {
            const settingsObj: any = {};
            settings.forEach(setting => {
              settingsObj[setting.key] = setting.value;
            });
            console.log('🔧 Settings loaded from database');
            return settingsObj;
          }
        } catch (dbError) {
          console.log('Direct DB access failed, trying Edge Function:', dbError);
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
        console.warn(`Settings API returned ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Handle both direct settings and wrapped response
      if (result.success && result.data) {
        console.log('🔧 Settings loaded successfully from API');
        return result.data;
      }

      return result;
    } catch (error) {
      // Return default settings to prevent app crash
      console.warn('Failed to fetch settings, using defaults:', error);
      const defaultSettings = {
        shop_name: 'LuxeCut Barber Shop',
        allow_signups: true,
        site_logo: 'https://picsum.photos/seed/logo/300/300'
      };
      return defaultSettings;
    }
  },
  updateSettings: async (settings: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/update-settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Function update-settings failed: ${errorText}`);
    }

    return response.json();
  },

  uploadSiteImage: async (file: File, bucket: string, path: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/upload-site-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
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
        console.warn('Error fetching barber by user ID:', error);
        return null;
      }

      return barber?.id || null;
    } catch (error) {
      console.warn('Error in getBarberIdByUserId:', error);
      return null;
    }
  },

  // Admin Barber Management
  addBarber: (barberData: { name: string; photo: string; photo_path?: string; experience: number; specialties: string[]; email: string; password: string; }): Promise<Barber> => {
    console.log("Sending barber data to add-barber function:", barberData);
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

    console.log("Sending barber update data to update-barber function:", cleanData);
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

  getAvailableSlots: async (barberId: string, date: string, serviceIds?: string[]): Promise<string[]> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase!.auth.getSession();
    const userToken = session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-available-slots?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}${serviceIds && serviceIds.length > 0 ? `&serviceIds=${encodeURIComponent(serviceIds.join(','))}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
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
      console.log('🔐 signIn called with:', { email: credentials.email, hasPassword: !!credentials.password });
      if (!supabase) {
        console.warn('🔐 Supabase not configured, returning error');
        return { data: {}, error: new AuthError("Supabase not configured.") };
      }
      console.log('🔐 Attempting Supabase signIn...');
      const result = await supabase.auth.signInWithPassword(credentials);
      console.log('🔐 Supabase signIn result:', {
        success: !result.error,
        error: result.error?.message,
        hasUser: !!result.data?.user
      });
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
      console.log('👤 getUserProfile called');
      if (!supabase) {
        console.log('👤 No supabase client available');
        return null;
      }

      console.log('👤 Getting user from Supabase auth...');

      try {
        // OPTIMIZED: Use getSession() first (instant, reads from localStorage)
        // Only fall back to getUser() (network call) if session doesn't exist
        console.log('👤 Calling getSession()...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('👤 getSession() completed:', { hasSession: !!session, error: sessionError?.message });

        if (sessionError) {
          console.warn('👤 Session error, trying getUser():', sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.log('👤 No session found, trying getUser() as fallback...');

          // Fallback to getUser() with timeout
          const userPromise = supabase.auth.getUser();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase getUser timeout after 5 seconds')), 5000)
          );

          const { data: { user }, error: userError } = await Promise.race([userPromise, timeoutPromise]) as any;

          if (userError || !user) {
            console.log('👤 No authenticated user found');
            return null;
          }

          const profile: UserProfile = {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || 'Unknown User',
            role: user.app_metadata?.role || 'customer',
          };

          console.log('👤 Profile created from getUser():', profile);
          return profile;
        }

        // SUCCESS: Got user from session (fast!)
        const user = session.user;

        console.log('👤 DEBUG: User metadata analysis');
        console.log('👤 user.app_metadata:', user.app_metadata);
        console.log('👤 user.user_metadata:', user.user_metadata);
        console.log('👤 Role from app_metadata:', user.app_metadata?.role);

        const profile: UserProfile = {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || 'Unknown User',
          role: user.app_metadata?.role || 'customer',
        };

        console.log('👤 Profile created from session (fast):', profile);
        return profile;
      } catch (error: any) {
        console.error('👤 Profile fetch failed:', error);
        console.error('👤 Error stack:', error?.stack);
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
  }
};

export const api: Api = realApi;
