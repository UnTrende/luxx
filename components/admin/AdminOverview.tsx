import React, { Suspense } from 'react';
import { Product, Service, Booking, UserProfile } from '../../types';
import { TrendingUp, Users, DollarSign, Calendar, Activity, ShoppingBag, Gift, AlertCircle, Award } from 'lucide-react';

const WalkInSummaryCard = React.lazy(() => import('./WalkInSummaryCard').then(module => ({ default: module.WalkInSummaryCard })));

interface AdminOverviewProps {
    stats: {
        totalRevenue: number;
        weeklyGrowth: string;
        averageRating: string;
        satisfaction: number;
        topServices: (Service & { bookingCount: number })[];
        activeChairs: { active: number; total: number };
        newBookingsCount: number;
    };
    bookings: Booking[];
    services: Service[];
    users: UserProfile[];
    barbers: unknown[];
    products: Product[];
    productSales: { dailyRevenue: { date: string; revenue: number }[]; topProducts: { product_id: string; name: string; revenue: number; quantity: number }[] };
    productSalesDays: number;
    setProductSalesDays: (days: number) => void;
    onNavigateToTab: (tab: string, filter?: string, context?: any) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
    stats,
    bookings,
    services,
    users,
    barbers,
    products,
    productSales,
    productSalesDays,
    setProductSalesDays,
    onNavigateToTab
}) => {
    // Calculate metrics for new cards
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 🎁 Rewards Activity
    const thisWeekBookings = bookings.filter(b => new Date(b.createdAt || b.date) >= weekAgo);
    const rewardBookings = thisWeekBookings.filter((b: unknown) => b.is_reward_booking);
    const totalPointsRedeemed = rewardBookings.reduce((sum: number, b: any) => sum + (b.points_redeemed || 0), 0);
    
    // Calculate points issued (from completed bookings this week)
    const completedThisWeek = thisWeekBookings.filter(b => b.status === 'completed');
    const pointsIssued = completedThisWeek.length * 10; // Approximate - you'd need actual points from loyalty_transactions
    
    const redemptionRate = pointsIssued > 0 ? Math.round((totalPointsRedeemed / pointsIssued) * 100) : 0;
    
    // 👥 Customer Insights
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const newCustomersThisWeek = users.filter(u => 
        u.role === 'customer' && 
        new Date(u.created_at) >= weekAgo
    ).length;
    
    // Calculate returning customers (customers with more than 1 booking)
    const customerBookingCounts = users.reduce((acc: any, user) => {
        if (user.role === 'customer') {
            acc[user.id] = bookings.filter(b => b.userId === user.id).length;
        }
        return acc;
    }, {});
    const returningCustomers = Object.values(customerBookingCounts).filter((count: unknown) => count > 1).length;
    const returningRate = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;
    
    // 💈 Barber Performance
    const barberBookingCounts = barbers.map(barber => ({
        name: barber.name,
        bookings: bookings.filter(b => b.barberId === barber.id && b.status === 'completed').length
    }));
    const topBarber = barberBookingCounts.sort((a, b) => b.bookings - a.bookings)[0];
    const avgBookingsPerBarber = barbers.length > 0 
        ? Math.round(bookings.filter(b => b.status === 'completed').length / barbers.length)
        : 0;
    const utilizationRate = barbers.length > 0 
        ? Math.round((completedThisWeek.length / (barbers.length * 7)) * 100) 
        : 0;
    
    // ⚠️ Action Required
    const today = new Date().toISOString().split('T')[0];
    const todaysBookings = bookings.filter(b => b.date === today && b.status === 'confirmed').length;
    const lowStockProducts = products.filter(p => p.stock < 5).length;
    const totalAlerts = todaysBookings + lowStockProducts;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
            {/* Revenue HUD - Large */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-gold/30 transition-all duration-500 shadow-glass">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                <DollarSign size={20} />
                            </div>
                            <h3 className="text-subtle-text text-xs font-bold uppercase tracking-[0.25em]">Total Revenue</h3>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">
                            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-xl md:text-2xl text-white/20 font-light">.{(stats.totalRevenue % 1).toFixed(2).substring(2)}</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-green-400 font-bold bg-green-400/5 px-4 py-1.5 rounded-full text-sm border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                <TrendingUp size={14} />
                                <span>+{stats.weeklyGrowth}%</span>
                            </div>
                            <span className="text-subtle-text text-xs font-medium tracking-wide">vs last week</span>
                        </div>
                    </div>

                    {/* Neon Chart */}
                    <div className="h-32 flex items-end gap-2 mt-8 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-white/5 rounded-t-sm transition-all duration-500 group-hover:bg-gold hover:!bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] relative overflow-hidden"
                                style={{ height: `${h}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Status - Compact & Glowing */}
            <div className="bg-glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between group hover:border-green-500/30 transition-all duration-500 relative overflow-hidden shadow-glass">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-green-400" />
                        <h3 className="text-subtle-text text-[10px] font-bold uppercase tracking-[0.2em]">Live Status</h3>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
                </div>
                <div className="relative z-10 mt-4">
                    <div className="text-4xl font-bold text-white mb-1 tracking-tight">
                        {stats.activeChairs.active}<span className="text-white/20 text-2xl">/{stats.activeChairs.total}</span>
                    </div>
                    <div className="text-xs text-green-400 font-bold tracking-wider uppercase">Chairs Active</div>
                </div>
            </div>

            {/* Quick Stats - Customers */}
            <div className="bg-glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden shadow-glass">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-400" />
                        <h3 className="text-subtle-text text-[10px] font-bold uppercase tracking-[0.2em]">Customers</h3>
                    </div>
                </div>
                <div className="relative z-10 mt-4">
                    <div className="text-4xl font-bold text-white mb-1 tracking-tight">
                        {users.filter(u => u.role === 'customer').length}
                    </div>
                    <div className="text-xs text-blue-400 font-bold tracking-wider uppercase">Total Registered</div>
                </div>
            </div>

            {/* Bookings Feed - Glass List */}
            <div className="col-span-1 md:col-span-2 bg-glass-card rounded-3xl p-6 border border-white/10 relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-gold border border-white/5">
                            <Calendar size={18} />
                        </div>
                        <h3 className="text-white font-bold text-base tracking-wide">Today's Schedule</h3>
                    </div>
                    <div className="text-[10px] font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20 uppercase tracking-wider">
                        {stats.newBookingsCount > 0 ? `+${stats.newBookingsCount} New` : 'Up to date'}
                    </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {bookings
                        .filter(b => new Date(b.date).toDateString() === new Date().toDateString() && b.status === 'confirmed')
                        .slice(0, 5)
                        .map((booking, idx) => {
                            const serviceNames = booking.serviceIds
                                ? booking.serviceIds.map((id: string) => services.find(s => s.id === id)?.name).filter(Boolean).join(', ')
                                : 'Service';

                            return (
                                <div
                                    key={booking.id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-gold/20 transition-all group animate-fade-in"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-transparent flex items-center justify-center text-gold font-serif font-bold border border-gold/10 text-xs">
                                            {booking.username?.charAt(0).toUpperCase() || 'C'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-gold transition-colors">{booking.username || 'Customer'}</p>
                                            <p className="text-[10px] text-subtle-text uppercase tracking-wide">{serviceNames}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-gold text-xs bg-black/40 px-2 py-1 rounded border border-white/5">{booking.timeSlot}</p>
                                    </div>
                                </div>
                            );
                        })}
                    {bookings.filter(b => new Date(b.date).toDateString() === new Date().toDateString() && b.status === 'confirmed').length === 0 && (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                            <p className="text-subtle-text text-sm">No confirmed bookings for today</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Services - Leaderboard Style */}
            <div className="col-span-1 row-span-2 bg-glass-card rounded-3xl p-6 border border-white/10 flex flex-col">
                <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2">
                    <span className="text-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] rounded-full">★</span> Top Services
                </h3>
                <div className="space-y-4 flex-1">
                    {stats.topServices.length > 0 ? (
                        stats.topServices.map((service, index) => (
                            <div key={service.id} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-gold text-black shadow-glow' : 'bg-white/10 text-white'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gold transition-colors text-sm">{service.name}</span>
                                    </div>
                                    <span className="text-subtle-text text-xs font-mono">{service.bookingCount}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-gold shadow-[0_0_10px_#D4AF37]' : 'bg-white/20'}`}
                                        style={{ width: `${(service.bookingCount / (stats.topServices[0]?.bookingCount || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-subtle-text py-4 text-sm">No data yet</div>
                    )}
                </div>
            </div>

            {/* Product Sales - Minimalist */}
            <div className="col-span-1 md:col-span-2 bg-glass-card rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <ShoppingBag size={18} />
                        </div>
                        <h3 className="text-white font-bold text-base tracking-wide">Product Performance</h3>
                    </div>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                        {[7, 30, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setProductSalesDays(d)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${productSalesDays === d ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-subtle-text hover:text-white'}`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Products List */}
                    <div className="space-y-2">
                        {productSales.topProducts.slice(0, 3).map((p, idx) => (
                            <div key={p.product_id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-md bg-black/40 flex items-center justify-center text-white/40 font-bold text-[10px]">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">{p.name}</div>
                                        <div className="text-[10px] text-subtle-text uppercase tracking-wide">{p.quantity} sold</div>
                                    </div>
                                </div>
                                <div className="font-mono font-bold text-purple-400 text-sm">${p.revenue.toFixed(0)}</div>
                            </div>
                        ))}
                        {productSales.topProducts.length === 0 && <div className="text-subtle-text text-sm">No sales data</div>}
                    </div>

                    {/* Mini Chart */}
                    <div className="flex items-end gap-1 h-full min-h-[100px] pb-2 px-2 border-b border-white/5">
                        {productSales.dailyRevenue.length > 0 ? (
                            productSales.dailyRevenue.map((d, i) => {
                                const max = Math.max(...productSales.dailyRevenue.map(v => v.revenue), 1);
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 bg-purple-500/20 rounded-t-sm hover:bg-purple-400 transition-colors relative group"
                                        style={{ height: `${Math.max((d.revenue / max) * 100, 10)}%` }}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 z-20">
                                            {d.date}: ${d.revenue}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full text-center text-subtle-text text-xs">No revenue data</div>
                        )}
                    </div>
                </div>
            </div>
            {/* 🎁 Rewards Activity Card - NEW */}
            <div 
                className="col-span-1 bg-glass-card rounded-3xl p-6 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer group"
                onClick={() => onNavigateToTab('Loyalty', undefined, {
                    pointsRedeemed: totalPointsRedeemed,
                    pointsIssued: pointsIssued,
                    redemptionRate: redemptionRate
                })}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                        <Gift size={20} />
                    </div>
                    <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Rewards</span>
                </div>
                <h3 className="text-white font-bold text-2xl mb-1">{totalPointsRedeemed}</h3>
                <p className="text-xs text-subtle-text mb-3">Points redeemed this week</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Points issued:</span>
                        <span className="text-white font-medium">{pointsIssued}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Redemption rate:</span>
                        <span className="text-cyan-400 font-bold">{redemptionRate}%</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-cyan-400 group-hover:text-cyan-300 transition-colors">View loyalty dashboard →</p>
                </div>
            </div>

            {/* 👥 Customer Insights Card - NEW */}
            <div 
                className="col-span-1 bg-glass-card rounded-3xl p-6 border border-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer group"
                onClick={() => onNavigateToTab('Users', undefined, {
                    totalCustomers: totalCustomers,
                    newCustomersThisWeek: newCustomersThisWeek,
                    returningRate: returningRate
                })}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                        <Users size={20} />
                    </div>
                    <span className="text-xs text-blue-400 uppercase tracking-widest font-bold">Customers</span>
                </div>
                <h3 className="text-white font-bold text-2xl mb-1">{totalCustomers}</h3>
                <p className="text-xs text-subtle-text mb-3">Total customers</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-subtle-text">New this week:</span>
                        <span className="text-green-400 font-medium">+{newCustomersThisWeek}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Returning rate:</span>
                        <span className="text-blue-400 font-bold">{returningRate}%</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors">View all customers →</p>
                </div>
            </div>

            {/* 💈 Barber Performance Card - NEW */}
            <div 
                className="col-span-1 bg-glass-card rounded-3xl p-6 border border-gold/20 hover:border-gold/50 transition-all cursor-pointer group"
                onClick={() => onNavigateToTab('Barbers', undefined, {
                    topBarberName: topBarber?.name || 'No data',
                    topBarberBookings: topBarber?.bookings || 0,
                    avgBookingsPerBarber: avgBookingsPerBarber,
                    utilizationRate: utilizationRate
                })}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold/20 transition-all">
                        <Award size={20} />
                    </div>
                    <span className="text-xs text-gold uppercase tracking-widest font-bold">Performance</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-1 truncate">{topBarber?.name || 'No data'}</h3>
                <p className="text-xs text-subtle-text mb-3">Top barber ({topBarber?.bookings || 0} bookings)</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Avg/barber:</span>
                        <span className="text-white font-medium">{avgBookingsPerBarber} bookings</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Utilization:</span>
                        <span className="text-gold font-bold">{utilizationRate}%</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-gold group-hover:text-yellow-300 transition-colors">View barber stats →</p>
                </div>
            </div>

            {/* ⚠️ Action Required Card - NEW */}
            <div 
                className="col-span-1 bg-glass-card rounded-3xl p-6 border border-red-500/20 hover:border-red-500/50 transition-all cursor-pointer group"
                onClick={() => onNavigateToTab('Bookings', 'pending')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20 transition-all">
                        <AlertCircle size={20} />
                    </div>
                    <span className="text-xs text-red-400 uppercase tracking-widest font-bold">Alerts</span>
                </div>
                <h3 className="text-white font-bold text-2xl mb-1">{totalAlerts}</h3>
                <p className="text-xs text-subtle-text mb-3">Items need attention</p>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Today's bookings:</span>
                        <span className={`font-medium ${todaysBookings > 0 ? 'text-gold' : 'text-white'}`}>{todaysBookings}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-subtle-text">Low stock items:</span>
                        <span className={`font-medium ${lowStockProducts > 0 ? 'text-red-400' : 'text-white'}`}>{lowStockProducts}</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-red-400 group-hover:text-red-300 transition-colors">Take action →</p>
                </div>
            </div>

            {/* Walk-in Summary Card - NEW */}
            <div className="col-span-1 md:col-span-2">
                <Suspense fallback={
                    <div className="bg-glass-card rounded-3xl p-6 border border-white/10 animate-pulse">
                        <div className="h-32 bg-white/5 rounded"></div>
                    </div>
                }>
                    <WalkInSummaryCard onViewDetails={() => onNavigateToTab('Analytics')} />
                </Suspense>
            </div>

        </div>
    );
};
