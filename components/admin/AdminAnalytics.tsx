import React from 'react';
import { Service, Product, Barber, UserProfile, Booking, OrderWithDetails, Attendance } from '../../types';

interface Stats {
    totalRevenue: number;
    weeklyGrowth: string;
    customerSatisfaction: number;
    topService: string;
}

interface AdminAnalyticsProps {
    services: Service[];
    products: Product[];
    barbers: Barber[];
    users: UserProfile[];
    bookings: Booking[];
    rosters: any[];
    orders: OrderWithDetails[];
    attendanceRecords: Attendance[];
    stats: Stats;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
    services,
    products,
    barbers,
    users,
    bookings,
    rosters,
    orders,
    attendanceRecords,
    stats
}) => {
    return (
        <div>
            <h2 className="text-2xl font-serif font-bold text-dubai-black mb-6">Analytics Dashboard</h2>

            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{services.length}</h3>
                    <p className="text-subtle-text">Services</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{products.length}</h3>
                    <p className="text-subtle-text">Products</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{barbers.length}</h3>
                    <p className="text-subtle-text">Barbers</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{users.length}</h3>
                    <p className="text-subtle-text">Users</p>
                </div>
            </div>

            {/* Business Operations */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{bookings.length}</h3>
                    <p className="text-subtle-text">Bookings</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{rosters.length}</h3>
                    <p className="text-subtle-text">Rosters</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">{orders.length}</h3>
                    <p className="text-subtle-text">Orders</p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 text-center">
                    <h3 className="text-2xl font-bold text-dubai-black">
                        {attendanceRecords.filter(a => a.status === 'present').length}
                    </h3>
                    <p className="text-subtle-text">Present Today</p>
                </div>
            </div>

            {/* Quick Insights */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8">
                    <h3 className="text-lg font-bold text-dubai-black mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Pending Bookings:</span>
                            <span className="text-dubai-black">
                                {bookings.filter(b => b.status === 'pending').length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Confirmed Bookings:</span>
                            <span className="text-dubai-black">
                                {bookings.filter(b => b.status === 'confirmed').length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Customer Users:</span>
                            <span className="text-dubai-black">
                                {users.filter(u => u.role === 'customer').length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Barber Users:</span>
                            <span className="text-dubai-black">
                                {users.filter(u => u.role === 'barber').length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8">
                    <h3 className="text-lg font-bold text-dubai-black mb-3">Order Insights</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Pending Orders:</span>
                            <span className="text-dubai-black">
                                {orders.filter(o => o.status === 'pending').length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Shipped Orders:</span>
                            <span className="text-dubai-black">
                                {orders.filter(o => o.status === 'shipped').length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Delivered Orders:</span>
                            <span className="text-dubai-black">
                                {orders.filter(o => o.status === 'delivered').length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Total Revenue:</span>
                            <span className="text-dubai-black font-bold">
                                ${orders.reduce((sum, order) => sum + (order.totalPrice || order.total_amount || 0), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8">
                    <h3 className="text-lg font-bold text-dubai-black mb-3">Financial Overview</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Total Revenue:</span>
                            <span className="text-dubai-black font-bold">
                                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Weekly Growth:</span>
                            <span className={`font-bold ${Number(stats.weeklyGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {Number(stats.weeklyGrowth) >= 0 ? '+' : ''}{stats.weeklyGrowth}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-subtle-text">Avg. Order Value:</span>
                            <span className="text-dubai-black">
                                ${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.totalPrice || o.total_amount || 0), 0) / orders.length).toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
