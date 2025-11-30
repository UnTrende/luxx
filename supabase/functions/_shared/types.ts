import { RealtimeChannel, Session } from '@supabase/supabase-js';

export interface BarberService {
  serviceId: string;
  price: number;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo: string;
  photo_path?: string; // Added for storage path
  experience: number;
  specialties: string[];
  rating: number;
  reviews: Review[];
  services: BarberService[];
  active: boolean; // Barbers can be deactivated
  user_id: string; // Foreign key to auth.users
  working_hours?: string[];
  is_active?: boolean;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // Default price
  category: string;
  image_url?: string; // Added for public URL
  image_path?: string; // Added for storage path
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categories: string[];
  price: number;
  imageUrl: string;
  image_url?: string; // Standardized field
  image_path?: string; // Added for storage path
  stock: number;
}

export interface Booking {
  id: string;
  userId: string | null; // Can be null for guest bookings
  userName: string;
  barberId: string;
  serviceIds: string[];
  date: string;
  timeSlot: string;
  totalPrice: number;
  status: 'Confirmed' | 'Completed' | 'Canceled' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reviewLeft: boolean;
  cancelMessage?: string;
  createdAt?: string; // When the booking was created (for "new bookings" metrics)
}

// New detailed type for API responses
export interface BookingWithDetails extends Omit<Booking, 'barberId' | 'userId'> {
  customer_id: string;
  barbers: { name: string; id: string } | null;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
}

export interface RevenueData {
  name: string;
  revenue: number;
}

// Updated to match the database schema
export interface AppNotification {
  id: string;
  recipient_id: string;
  type: string | null;
  message: string;
  payload: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface CustomerAlert {
  id: string;
  userId: string;
  message: string;
  seen: boolean;
}

export interface Attendance {
  barberId: string;
  barberName?: string;
  status: 'Present' | 'Absent' | 'Absent (Approved)' | 'Logged Out' | 'clocked-in' | 'on-break' | 'clocked-out';
  date?: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakDuration?: number;
  workingHours?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

export interface MessageTemplate {
  id: string;
  text: string;
}

export interface ProductOrder {
  id: string;
  productId: string;
  userId: string | null;
  userName: string;
  quantity: number;
  status: 'Reserved' | 'PickedUp' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: string;
}

// Site Settings Interface
export interface SiteSettings {
  shop_name?: string;
  allow_signups?: boolean;
  site_logo?: string;
  hero_images?: string[];
  [key: string]: any; // Allow additional properties
}

// New detailed type for API responses
export interface OrderWithDetails extends Omit<ProductOrder, 'userId'> {
  customer_id: string;
  products: { name: string; imageUrl: string; price: number } | null;
}


// Represents the logged-in user's complete profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'barber' | 'admin';
  phone?: string;
}



// API Interface
export interface Api {
  // Public Data Fetching
  getBarbers: () => Promise<Barber[]>;
  getBarberById: (id: string) => Promise<Barber | null>;
  getProducts: () => Promise<Product[]>;
  getProductById: (id: string) => Promise<Product | null>;
  getServices: () => Promise<Service[]>;
  getBookedSlots: (barberId: string, date: string) => Promise<string[]>;
  getOrderById: (orderId: string) => Promise<OrderWithDetails | null>;

  // Admin Data Fetching
  getAllOrders: () => Promise<OrderWithDetails[]>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<{ success: boolean; order: OrderWithDetails }>;
  getAllBookings: () => Promise<Booking[]>;
  getAllUsers: () => Promise<{ users: any[] }>;
  getAttendance: (date?: string) => Promise<Attendance[]>;
  updateAttendance: (action: 'clock-in' | 'clock-out' | 'start-break' | 'end-break' | 'mark-present' | 'mark-absent', date?: string) => Promise<{ success: boolean; message: string; attendance?: Attendance }>;
  updateAttendanceStatus: (attendanceId: string, status: 'present' | 'absent' | 'late') => Promise<{ success: boolean; attendance: Attendance }>;
  updateBookingStatus: (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => Promise<{ success: boolean; booking: Booking }>;

  // Barber Data Fetching
  getBarberAttendance: (date?: string) => Promise<Attendance | null>;

  // Roster Management
  getRosters: (weekKey?: string) => Promise<{ rosters: any[] }>;
  getBarberRosters: () => Promise<{ rosters: any[] }>;
  createRoster: (name: string, startDate: string, endDate: string, days: any) => Promise<{ roster: any }>;
  updateRoster: (rosterId: string, name: string, startDate: string, endDate: string, days: any) => Promise<{ roster: any }>;
  deleteRoster: (rosterId: string) => Promise<{ success: boolean }>;
  getBarberRoster: (barberId?: string) => Promise<any[]>;

  // Admin Product Management
  addProduct: (productData: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (productId: string, productData: Omit<Product, 'id'>) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<{ success: boolean }>;

  // Admin Service Management
  addService: (serviceData: Omit<Service, 'id'>) => Promise<Service>;
  updateService: (serviceId: string, serviceData: Partial<Omit<Service, 'id'>>) => Promise<Service>;
  deleteService: (serviceId: string) => Promise<{ success: boolean }>;

  // Admin Barber Management
  addBarber: (barberData: { name: string; photo: string; experience: number; specialties: string[]; email: string; password: string; }) => Promise<Barber>;
  updateBarber: (barberId: string, barberData: Partial<Barber>) => Promise<Barber>;
  deleteBarber: (barberId: string, userId: string) => Promise<{ success: boolean }>;
  updateBarberServices: (barberId: string, services: BarberService[]) => Promise<Barber>;

  // Admin User Management
  syncUserRole: (userId: string, newRole: 'customer' | 'barber' | 'admin') => Promise<{ success: boolean; message: string }>;

  // Authenticated Customer Actions
  createBooking: (bookingDetails: Omit<Booking, 'id' | 'status' | 'reviewLeft'>) => Promise<Booking>;
  createProductOrder: (order: Omit<ProductOrder, 'id' | 'userId' | 'userName' | 'status' | 'timestamp'>) => Promise<ProductOrder>;
  getMyBookings: () => Promise<BookingWithDetails[]>;
  getMyOrders: () => Promise<OrderWithDetails[]>;
  cancelBooking: (bookingId: string) => Promise<{ success: boolean }>;
  submitReview: (review: { bookingId: string; rating: number; comment: string; barberId: string; }) => Promise<{ success: boolean }>;

  // Authenticated Barber Actions
  getBarberSchedule: () => Promise<Booking[]>;
  cancelBookingByBarber: (bookingId: string, reason: string) => Promise<{ success: boolean }>;
  updateBarberAvailability: (hiddenSlots: string[]) => Promise<{ success: boolean }>;

  // New methods for booking flow
  getBarberServices: (barberId: string) => Promise<Service[]>;
  getAvailableSlots: (barberId: string, date: string, serviceIds?: string[]) => Promise<string[]>;

  // Notifications
  notifications: {
    getNotifications: () => Promise<AppNotification[]>;
    markNotificationAsRead: (notificationId: string) => Promise<{ success: boolean }>;
    subscribeToNotifications: (userId: string, onNewNotification: (notification: AppNotification) => void) => RealtimeChannel | null;
  };

  // Authentication
  auth: {
    signIn: (credentials: { email: string; password: string }) => Promise<any>;
    signUp: (credentials: { email: string; password: string; name: string }) => Promise<any>;
    signOut: () => Promise<any>;
    getUserProfile: () => Promise<UserProfile | null>;
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => any;
    updateUser: (attributes: { email?: string; password?: string; data?: any }) => Promise<any>;
  };

  // Site Settings Management
  getSettings: () => Promise<{ success: boolean; data: SiteSettings }>;
  updateSettings: (settingsData: {
    siteName?: string;
    logoPath?: string;
    heroImages?: string[];
    allowSignups?: boolean;
    siteLogo?: string;
    shopName?: string;
  }) => Promise<{ success: boolean; data: SiteSettings }>;
  uploadSiteImage: (file: File, bucket: string, path: string) => Promise<{
    success: boolean;
    path: string;
    publicUrl: string;
    message: string
  }>;
  getBarberIdByUserId: (userId: string) => Promise<string | null>;
  supabase: any; // Add the supabase client property
}
