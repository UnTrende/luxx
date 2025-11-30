import React from 'react';
import { Product, Service, Booking, UserProfile } from '../../types';

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
    productSales: { dailyRevenue: { date: string; revenue: number }[]; topProducts: { product_id: string; name: string; revenue: number; quantity: number }[] };
    productSalesDays: number;
    setProductSalesDays: (days: number) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
    stats,
    bookings,
    services,
    users,
    productSales,
    productSalesDays,
    setProductSalesDays
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(220px,auto)]">
            {/* Revenue Card - Large */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-dubai-gold/50 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-dubai-gold/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h3 className="text-dubai-gold text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</h3>
                    <h2 className="text-5xl font-serif font-bold text-dubai-black mb-4">${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 w-fit px-3 py-1 rounded-full text-sm mb-8 border border-green-200">
                        <span>+{stats.weeklyGrowth}%</span>
                        <span className="text-green-600/60 font-normal">vs last week</span>
                    </div>
                    {/* Placeholder Chart */}
                    <div className="h-32 flex items-end gap-2 opacity-50">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-gray-200 rounded-t-sm transition-all duration-500 group-hover:bg-dubai-gold" style={{ height: `${h}% ` }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Status Card */}
            <div className="bg-dubai-black text-white rounded-3xl p-8 shadow-xl shadow-black/20 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start">
                    <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">Live Shop Status</h3>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                </div>
                <div>
                    <div className="text-3xl font-bold mb-1">{stats.activeChairs.active}/{stats.activeChairs.total}</div>
                    <div className="text-sm text-white/60">Chairs Active</div>
                </div>
            </div>

            {/* Bookings Today - Enhanced with booking list */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-dubai-gold/50 transition-all flex flex-col group">
                <h3 className="text-dubai-gold text-xs font-bold uppercase tracking-widest mb-4">Confirmed Bookings Today</h3>
                <div className="text-3xl font-serif font-bold text-dubai-black mb-1">
                    {bookings.filter(b => new Date(b.date).toDateString() === new Date().toDateString() && b.status === 'confirmed').length}
                </div>
                <div className="text-sm text-green-600 font-bold mb-4">
                    {stats.newBookingsCount > 0 ? `+ ${stats.newBookingsCount} New` : 'No new bookings'}
                </div>

                {/* Today's Bookings List */}
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {bookings
                        .filter(b => new Date(b.date).toDateString() === new Date().toDateString() && b.status === 'confirmed')
                        .slice(0, 5)
                        .map(booking => {
                            const serviceNames = booking.service_ids
                                ? booking.service_ids.map((id: string) => services.find(s => s.id === id)?.name).filter(Boolean).join(', ')
                                : 'Service';

                            return (
                                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-dubai-gold/30 transition-all text-sm group-hover:bg-white shadow-sm">
                                    <div className="flex-1">
                                        <p className="font-bold text-dubai-black">{booking.username || 'Customer'}</p>
                                        <p className="text-xs text-gray-500">{serviceNames}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-dubai-gold text-xs">{booking.timeSlot}</p>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 border border-green-200">
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    {bookings.filter(b => new Date(b.date).toDateString() === new Date().toDateString() && b.status === 'confirmed').length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">No confirmed bookings today</p>
                    )}
                </div>
            </div>

            {/* Staff Performance - Tall */}
            <div className="col-span-1 row-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-dubai-gold/50 transition-all">
                {/* Service Popularity */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner">
                    <h3 className="font-bold text-dubai-black mb-4">Top Services</h3>
                    <div className="space-y-4">
                        {stats.topServices.length > 0 ? (
                            stats.topServices.map((service, index) => (
                                <div key={service.id} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-dubai-gold/20 flex items-center justify-center text-dubai-gold font-bold text-sm border border-dubai-gold/20">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-dubai-black">{service.name}</span>
                                            <span className="text-gray-500 text-sm">{service.bookingCount} bookings</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-dubai-gold rounded-full"
                                                style={{ width: `${(service.bookingCount / (stats.topServices[0]?.bookingCount || 1)) * 100}% ` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-4">No data yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Card */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-dubai-gold/50 transition-all">
                <h3 className="text-dubai-gold text-xs font-bold uppercase tracking-widest mb-6">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <div className="text-3xl font-serif font-bold text-dubai-black mb-1">
                            {users.filter(u => u.role === 'customer').length}
                        </div>
                        <div className="text-sm text-gray-500">Total Customers</div>
                    </div>
                    <div>
                        <div className="text-3xl font-serif font-bold text-dubai-black mb-1">
                            ${(stats.totalRevenue / (users.filter(u => u.role === 'customer').length || 1)).toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-500">Avg Customer Value</div>
                    </div>
                </div>
            </div>

            {/* Product Sales Analytics */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-dubai-gold/50 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-dubai-gold text-xs font-bold uppercase tracking-widest">Product Sales</h3>
                    <div className="flex gap-2">
                        {[7, 30, 90].map(d => (
                            <button key={d} onClick={() => setProductSalesDays(d)}
                                className={`px - 3 py - 1 rounded - full text - xs font - bold transition - all ${productSalesDays === d ? 'bg-dubai-gold text-dubai-black' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} `}>{d}d</button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Daily Revenue Sparkline */}
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Daily Revenue (Last 30 Days)</h3>
                        {productSales.dailyRevenue.length > 0 ? (
                            <div className="h-32 flex items-end gap-1">
                                {(() => {
                                    const values = productSales.dailyRevenue.map(d => d.revenue);
                                    const max = Math.max(...values, 1);
                                    return productSales.dailyRevenue.map((d, i) => (
                                        <div key={i} title={`${d.date}: $${d.revenue.toFixed(2)} `}
                                            className="flex-1 bg-gray-200 hover:bg-dubai-gold transition-colors rounded-t-sm"
                                            style={{ height: `${Math.round((d.revenue / max) * 100)}% ` }} />
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-gray-400">No revenue data</div>
                        )}
                    </div>

                    {/* Top Products */}
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Top Products</h3>
                        {productSales.topProducts.length > 0 ? (
                            <div className="space-y-3">
                                {productSales.topProducts.slice(0, 5).map((p, idx) => (
                                    <div key={p.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-dubai-gold/10 text-dubai-gold font-bold flex items-center justify-center border border-dubai-gold/10">{idx + 1}</div>
                                            <div>
                                                <div className="font-bold text-dubai-black">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.quantity} sold</div>
                                            </div>
                                        </div>
                                        <div className="font-mono font-bold text-dubai-gold">${p.revenue.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-400">No product sales yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
