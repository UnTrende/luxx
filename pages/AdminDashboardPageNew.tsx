import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Service, Product, Barber, Booking, UserProfile, SiteSettings, Attendance, OrderWithDetails } from '../types';
import { useQuery } from '@tanstack/react-query';
import {
  useServices,
  useProducts,
  useBarbers,
  useUsers,
  useBookings,
  useOrders,
  useAttendance,
  useRosters,
  useSiteSettings
} from '../src/hooks/useAdminQueries';
import { AdminSkeleton } from '../components/admin/AdminSkeleton';

import { logger } from '../src/lib/logger';
import {
  LayoutDashboard,
  Scissors,
  ShoppingBag,
  Users,
  Calendar,
  ClipboardList,
  Clock,
  Settings,
  BarChart3,
  Package,
  Star,
  Menu,
  X,
  DollarSign
} from 'lucide-react';

// Lazy load components for performance
const AdminOverview = React.lazy(() => import('../components/admin/AdminOverview').then(module => ({ default: module.AdminOverview })));
const AdminServicesManager = React.lazy(() => import('../components/admin/AdminServicesManager').then(module => ({ default: module.AdminServicesManager })));
const AdminProductsManager = React.lazy(() => import('../components/admin/AdminProductsManager').then(module => ({ default: module.AdminProductsManager })));
const AdminBarbersManager = React.lazy(() => import('../components/admin/AdminBarbersManager').then(module => ({ default: module.AdminBarbersManager })));
const AdminUsersManager = React.lazy(() => import('../components/admin/AdminUsersManager').then(module => ({ default: module.AdminUsersManager })));
const AdminBookingsManager = React.lazy(() => import('../components/admin/AdminBookingsManager').then(module => ({ default: module.AdminBookingsManager })));
const AdminOrdersManager = React.lazy(() => import('../components/admin/AdminOrdersManager').then(module => ({ default: module.AdminOrdersManager })));
const AdminRosterManager = React.lazy(() => import('../components/admin/AdminRosterManager').then(module => ({ default: module.AdminRosterManager })));
const AdminAttendanceManager = React.lazy(() => import('../components/admin/AdminAttendanceManager').then(module => ({ default: module.AdminAttendanceManager })));
const AdminSettings = React.lazy(() => import('../components/admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminAnalytics = React.lazy(() => import('../components/admin/AdminAnalytics').then(module => ({ default: module.AdminAnalytics })));
const AdminLoyaltyDashboard = React.lazy(() => import('../components/admin/AdminLoyaltyDashboard'));
const BillingCenter = React.lazy(() => import('../components/admin/BillingCenter').then(module => ({ default: module.BillingCenter })));
const WalkInSummaryCard = React.lazy(() => import('../components/admin/WalkInSummaryCard').then(module => ({ default: module.WalkInSummaryCard })));

export default function AdminDashboardPageNew() {
  logger.info('🎯 NEW AdminDashboard: Component mounting safely!', undefined, 'AdminDashboardPageNew');

  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('Overview');
  const [bookingsFilter, setBookingsFilter] = useState<string | null>(null);
  const [rewardsContext, setRewardsContext] = useState<any>(null);
  const [showLoyaltyBanner, setShowLoyaltyBanner] = useState(false);
  const [customerContext, setCustomerContext] = useState<any>(null);
  const [showUsersBanner, setShowUsersBanner] = useState(false);
  const [barberContext, setBarberContext] = useState<any>(null);
  const [showBarbersBanner, setShowBarbersBanner] = useState(false);
  const [productSalesDays, setProductSalesDays] = useState(30);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  // React Query Hooks
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: barbersData, isLoading: barbersLoading } = useBarbers();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance();
  const { data: rostersData, isLoading: rostersLoading } = useRosters();
  const { data: settingsData, isLoading: settingsLoading } = useSiteSettings();
  
  // Fetch transactions for revenue calculation
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.getTransactions(),
    staleTime: 30000,
  });

  // Fetch analytics overview for real weekly growth data
  const { data: analyticsOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.getAnalyticsOverview(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Local State Bridges (for compatibility with child components that expect setters)
  // Note: ideally child components should be refactored to use mutations, but this maintains compatibility.
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ shop_name: 'LuxeCut Barber Shop', allow_signups: true });
  const [transactions, setTransactions] = useState<any[]>([]);

  // Sync Query Data to Local State
  useEffect(() => { if (servicesData) setServices(servicesData); }, [servicesData]);
  useEffect(() => { if (productsData) setProducts(productsData); }, [productsData]);
  useEffect(() => { if (barbersData) setBarbers(barbersData); }, [barbersData]);
  useEffect(() => { if (usersData) setUsers(usersData); }, [usersData]);
  useEffect(() => { if (bookingsData) setBookings(bookingsData); }, [bookingsData]);
  useEffect(() => { if (ordersData) setOrders(ordersData); }, [ordersData]);
  useEffect(() => { if (attendanceData) setAttendanceRecords(attendanceData); }, [attendanceData]);
  useEffect(() => { if (rostersData) setRosters(rostersData); }, [rostersData]);
  useEffect(() => { if (settingsData) setSiteSettings(settingsData); }, [settingsData]);
  useEffect(() => { if (transactionsData) setTransactions(transactionsData); }, [transactionsData]);

  const isLoading = servicesLoading || productsLoading || barbersLoading || bookingsLoading;

  // Derived stats for AdminOverview (Memoized)
  const stats = useMemo(() => {
    // Calculate TODAY's revenue only (from paid orders + billing transactions)
    const today = new Date().toISOString().split('T')[0];
    
    // Revenue from product orders (paid)
    const ordersRevenue = (orders || [])
      .filter(o => o.created_at && o.created_at.startsWith(today) && o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.totalPrice || o.total_amount || 0), 0);
    
    // Revenue from billing transactions (walk-in, bookings)
    const transactionsRevenue = (transactions || [])
      .filter(t => t.created_at && t.created_at.startsWith(today))
      .reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    const totalRevenue = ordersRevenue + transactionsRevenue;

    // Top services
    const topServiceCounts: Record<string, number> = {};
    (bookings || []).forEach(b => {
      if (b.serviceIds && Array.isArray(b.serviceIds)) {
        b.serviceIds.forEach(id => {
          topServiceCounts[id] = (topServiceCounts[id] || 0) + 1;
        });
      }
    });

    const topServices = Object.entries(topServiceCounts)
      .map(([id, count]) => {
        const service = services?.find(s => s.id === id);
        return service ? { ...service, bookingCount: count } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b?.bookingCount || 0) - (a?.bookingCount || 0))
      .slice(0, 5) as (Service & { bookingCount: number })[];

    // Active chairs (reuse today variable)
    const activeBarbers = (attendanceRecords || []).filter(a =>
      a.date === today && (a.status === 'present' || a.status === 'Present')
    ).length;

    // New bookings
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newBookingsCount = (bookings || []).filter(b => {
      const bookingDate = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
      return bookingDate > oneDayAgo;
    }).length;

    return {
      totalRevenue,
      weeklyGrowth: analyticsOverview?.stats?.weeklyGrowth?.toString() || '0',
      averageRating: '4.8',
      satisfaction: 4.8,
      topServices,
      activeChairs: { active: activeBarbers, total: barbers?.length || 0 },
      newBookingsCount
    };
  }, [orders, transactions, bookings, services, attendanceRecords, barbers, analyticsOverview]);

  // Derived Product Sales (Memoized)
  const productSales = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - productSalesDays);
    const recentOrders = (orders || []).filter(o => new Date(o.created_at || o.timestamp) >= cutoffDate);

    const dailyRevenueMap: Record<string, number> = {};
    recentOrders.forEach(o => {
      const date = new Date(o.created_at || o.timestamp).toISOString().split('T')[0];
      dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + (o.totalPrice || o.total_amount || 0);
    });

    const dailyRevenue = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const productRevenueMap: Record<string, { revenue: number; quantity: number; name: string }> = {};
    recentOrders.forEach(o => {
      const pid = o.productId || o.product_id;
      const pname = o.products?.name || o.product?.name || 'Unknown';
      if (!productRevenueMap[pid]) productRevenueMap[pid] = { revenue: 0, quantity: 0, name: pname };
      productRevenueMap[pid].revenue += (o.totalPrice || o.total_amount || 0);
      productRevenueMap[pid].quantity += o.quantity || 1;
    });

    const topProducts = Object.entries(productRevenueMap)
      .map(([product_id, data]) => ({ product_id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { dailyRevenue, topProducts };
  }, [orders, productSalesDays]);


  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dubai-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dubai-black font-serif text-xl animate-pulse">Loading Empire View...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'Overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { id: 'Billing', icon: <DollarSign size={20} />, label: 'Billing' },
    { id: 'Services', icon: <Scissors size={20} />, label: 'Services' },
    { id: 'Products', icon: <ShoppingBag size={20} />, label: 'Products' },
    { id: 'Barbers', icon: <Users size={20} />, label: 'Barbers' },
    { id: 'Users', icon: <Users size={20} />, label: 'Clients' },
    { id: 'Bookings', icon: <Calendar size={20} />, label: 'Bookings' },
    { id: 'Rosters', icon: <ClipboardList size={20} />, label: 'Rosters' },
    { id: 'Attendance', icon: <Clock size={20} />, label: 'Attendance' },
    { id: 'Orders', icon: <Package size={20} />, label: 'Orders' },
    { id: 'Settings', icon: <Settings size={20} />, label: 'Settings' },
    { id: 'Analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { id: 'Loyalty', icon: <Star size={20} />, label: 'Loyalty' },
  ];

  return (
    <div className="min-h-screen bg-midnight-gradient flex font-sans text-white selection:bg-gold selection:text-black overflow-hidden relative">
      <ToastContainer theme="dark" position="bottom-right" aria-label="Notifications" />

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={`
        w-72 bg-glass-card flex-shrink-0 fixed h-full z-50 flex flex-col border-r border-white/5 shadow-glass backdrop-blur-xl transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-8 border-b border-white/5 relative overflow-hidden group flex justify-between items-center">
          <div>
            <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
            <h1 className="text-3xl font-serif font-bold text-white tracking-wider relative z-10">LUXECUT</h1>
            <p className="text-xs text-gold uppercase tracking-[0.3em] mt-1 font-bold relative z-10">Empire View</p>
          </div>
          {/* Close button for mobile */}
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false); // Close menu on selection
              }}
              style={{ animationDelay: `${index * 50}ms` }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden animate-slide-up ${activeTab === item.id
                ? 'text-midnight font-bold shadow-glow transform scale-[1.02]'
                : 'text-subtle-text hover:text-white hover:bg-white/5'
                }`}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gold-gradient" />
              )}

              <span className={`text-xl relative z-10 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-midnight' : 'text-gold'}`}>{item.icon}</span>
              <span className="uppercase tracking-wider text-xs relative z-10">{item.label}</span>

              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-midnight animate-pulse relative z-10" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-midnight font-bold shadow-glow">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate text-white">{user?.email}</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <button
            onClick={() => api.auth.signOut().then(() => navigate('/login'))}
            className="w-full py-3 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-widest text-subtle-text"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen relative w-full overflow-x-hidden">
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-72 right-0 h-96 bg-gold/5 blur-[100px] pointer-events-none" />

        {/* Mobile Header */}
        <header className="lg:hidden bg-glass-card border-b border-white/5 p-4 sticky top-0 z-30 flex justify-between items-center shadow-glass backdrop-blur-xl">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="font-serif font-bold text-white text-xl tracking-wider">LUXECUT</span>
          <div className="w-10" /> {/* Spacer to center title */}
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto relative z-10">
          <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end animate-fade-in gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-white mb-2 tracking-tight flex items-center gap-2 md:gap-3">
                <span className="text-gold animate-pulse-glow p-1.5 md:p-2 rounded-full bg-white/5">{menuItems.find(i => i.id === activeTab)?.icon}</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">{activeTab}</span>
              </h2>
              <p className="text-sm md:text-base text-subtle-text font-light tracking-wide">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {(servicesLoading || productsLoading) && (
              <div className="flex gap-4">
                <div className="bg-glass px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-glass">
                  <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                  <span className="text-xs md:text-sm font-bold text-white/80 tracking-wider uppercase">Syncing...</span>
                </div>
              </div>
            )}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Suspense fallback={<AdminSkeleton />}>
              {activeTab === 'Overview' && (
                <AdminOverview
                  stats={stats}
                  bookings={bookings}
                  services={services}
                  users={users}
                  barbers={barbers}
                  products={products}
                  productSales={productSales}
                  productSalesDays={productSalesDays}
                  setProductSalesDays={setProductSalesDays}
                  onNavigateToTab={(tab, filter, context) => {
                    setActiveTab(tab);
                    if (tab === 'Bookings' && filter) {
                      setBookingsFilter(filter);
                    }
                    if (tab === 'Loyalty' && context) {
                      setRewardsContext(context);
                      setShowLoyaltyBanner(true);
                    }
                    if (tab === 'Users' && context) {
                      setCustomerContext(context);
                      setShowUsersBanner(true);
                    }
                    if (tab === 'Barbers' && context) {
                      setBarberContext(context);
                      setShowBarbersBanner(true);
                    }
                  }}
                />
              )}

              {activeTab === 'Billing' && <BillingCenter />}

              {activeTab === 'Services' && <AdminServicesManager services={services} setServices={setServices} />}
              {activeTab === 'Products' && <AdminProductsManager products={products} setProducts={setProducts} />}
              {activeTab === 'Barbers' && <AdminBarbersManager barbers={barbers} setBarbers={setBarbers} showContextBanner={showBarbersBanner} barberContext={barberContext} />}
              {activeTab === 'Users' && <AdminUsersManager users={users} setUsers={setUsers} showContextBanner={showUsersBanner} customerContext={customerContext} />}
              {activeTab === 'Bookings' && <AdminBookingsManager bookings={bookings} setBookings={setBookings} services={services} barbers={barbers} initialFilter={bookingsFilter} />}
              {activeTab === 'Orders' && <AdminOrdersManager orders={orders} setOrders={setOrders} />}
              {activeTab === 'Rosters' && <AdminRosterManager rosters={rosters} setRosters={setRosters} barbers={barbers} />}
              {activeTab === 'Attendance' && <AdminAttendanceManager attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} barbers={barbers} />}
              {activeTab === 'Settings' && <AdminSettings siteSettings={siteSettings} setSiteSettings={setSiteSettings} />}
              {activeTab === 'Analytics' && (
                <AdminAnalytics
                  services={services}
                  products={products}
                  barbers={barbers}
                  users={users}
                  bookings={bookings}
                  rosters={rosters}
                  orders={orders}
                  attendanceRecords={attendanceRecords}
                  stats={stats}
                />
              )}
              {activeTab === 'Loyalty' && <AdminLoyaltyDashboard showContextBanner={showLoyaltyBanner} rewardsContext={rewardsContext} />}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}