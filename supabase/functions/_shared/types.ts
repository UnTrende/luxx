import { RealtimeChannel, Session } from 'https://esm.sh/@supabase/supabase-js@2';

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
  image_path?: string; // Added for storage path // DEPRECATED: Use tier-specific fields instead
  loyalty_points_silver?: number; // Loyalty points for Silver tier customers
  loyalty_points_gold?: number; // Loyalty points for Gold tier customers
  loyalty_points_platinum?: number; // Loyalty points for Platinum tier customers
  redemption_points?: number; // Points required to redeem this service for free
  is_redeemable?: boolean; // Whether this service can be redeemed with points
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
  barberId: string;
  userId: string;
  serviceIds: string[];
  date: string;
  timeSlot: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
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
  tax_rate?: number; // Tax rate percentage for billing system
  [key: string]: unknown; // Allow additional properties
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
  // Loyalty fields
  total_confirmed_visits?: number;
  redeemable_points?: number;
  status_tier?: 'Silver' | 'Gold' | 'Platinum';
}

// Loyalty statistics (Spending-based system)
export interface LoyaltyStats {
  totalConfirmedVisits: number;
  redeemablePoints: number;
  statusTier: 'Silver' | 'Gold' | 'Platinum';
  progressToNextTier: number;
  nextTier: string;
}

// Loyalty history entry
export interface LoyaltyHistoryEntry {
  id: string;
  user_id: string;
  transaction_type: 'EARNED' | 'PENALTY' | 'REDEEMED';
  points_amount: number;
  description: string;
  booking_id?: string;
  created_at: string;
}

// Loyalty settings (Admin-configurable)
export interface LoyaltySettings {
  service_rate_silver: number;
  service_rate_gold: number;
  service_rate_platinum: number;
  silver_threshold: number;
  gold_threshold: number;
  platinum_threshold: number;
  late_cancellation_penalty: number;
  no_show_penalty: number;
  updated_at: string;
}

// Transaction types for billing system
export interface ServiceItem {
  service_id?: string;
  service_name: string;
  price: number;
}

export interface Transaction {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_id?: string;
  customer_type: 'walk-in' | 'booking';
  services: ServiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'mobile';
  barber_id?: string;
  booking_id?: string;
  receipt_number: string;
  created_at: string;
  created_by?: string;
}

export interface CreateTransactionInput {
  customerName: string;
  customerPhone: string;
  customerId?: string;
  customerType: 'walk-in' | 'booking';
  services: ServiceItem[];
  barberId?: string;
  bookingId?: string;
  paymentMethod: 'cash' | 'card' | 'mobile';
}

export interface TransactionAnalytics {
  dailyBreakdown: {
    date: string;
    bookings: { count: number; revenue: number };
    walkIns: { count: number; revenue: number };
    total: { count: number; revenue: number };
  }[];
  frequentWalkIns: {
    customer_name: string;
    customer_phone: string;
    visit_count: number;
    total_spent: number;
  }[];
  paymentMethods: {
    cash: number;
    card: number;
    mobile: number;
  };
}


// API Interface
export interface Api {
  // Public Data Fetching
  fetchCSRFToken: () => Promise<string | null>;
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
  getAllUsers: () => Promise<{ users: unknown[] }>;
  getAttendance: (date?: string) => Promise<Attendance[]>;
  updateAttendance: (action: 'clock-in' | 'clock-out' | 'start-break' | 'end-break' | 'mark-present' | 'mark-absent', date?: string) => Promise<{ success: boolean; message: string; attendance?: Attendance }>;
  updateAttendanceStatus: (attendanceId: string, status: 'present' | 'absent' | 'late') => Promise<{ success: boolean; attendance: Attendance }>;
  updateBookingStatus: (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => Promise<{ success: boolean; booking: Booking }>;

  // Barber Data Fetching
  getBarberAttendance: (date?: string) => Promise<Attendance | null>;

  // Roster Management
  getRosters: (weekKey?: string) => Promise<{ rosters: unknown[] }>;
  getBarberRosters: () => Promise<{ rosters: unknown[] }>;
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
  isBarberAvailable: (barberId: string, date: string) => Promise<{ available: boolean; reason?: string }>;
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
  supabase: unknown; // Add the supabase client property

  // Loyalty System
  getLoyaltyStats: () => Promise<LoyaltyStats>;
  getLoyaltyHistory: (limit?: number, offset?: number) => Promise<LoyaltyHistoryEntry[]>;
  updateLoyaltySettings: (settings: Partial<LoyaltySettings>) => Promise<LoyaltySettings>;
  processLoyaltyTransaction: (bookingId: string, amountPaid: number, serviceId: string) => Promise<any>;
  processPenaltyTransaction: (userId: string, penaltyType: 'late_cancellation' | 'no_show', bookingId?: string, reason?: string) => Promise<any>;
  checkLoyaltyTierUpdate: () => Promise<any>;

  // Analytics & Export
  getAnalyticsOverview: () => Promise<any>;
  getDetailedReports: (reportType: 'retention' | 'peak_times', dateRange?: any) => Promise<any>;
  exportData: (entity: 'bookings' | 'orders' | 'users', format?: 'csv') => Promise<{ csv: string; filename: string }>;

  // Billing & Transactions
  createTransaction: (data: CreateTransactionInput) => Promise<Transaction>;
  getBookingsForBilling: () => Promise<BookingWithDetails[]>;
  getTransactionAnalytics: (filter?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'customer_type' }) => Promise<TransactionAnalytics>;
  getTransactions: (filter?: { startDate?: string; endDate?: string; customerType?: 'walk-in' | 'booking' }) => Promise<Transaction[]>;
  exportDailyReport: (date: string, format: 'csv' | 'pdf') => Promise<{ data: string; filename: string }>;
}
