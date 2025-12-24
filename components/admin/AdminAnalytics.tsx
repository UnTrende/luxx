import React, { useState, useEffect } from 'react';
import { Service, Product, Barber, UserProfile, Booking, OrderWithDetails, Attendance } from '../../types';
import { BarChart3, TrendingUp, Users, ShoppingBag, Calendar, Clock, DollarSign, Package, CheckCircle, AlertCircle, Download, PieChart as PieIcon, Activity, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { AnalysisBarChart, AnalysisLineChart, AnalysisPieChart } from './AnalyticsCharts';
import { toast } from 'react-toastify';
import { logger } from '../../src/lib/logger';

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
    rosters: unknown[];
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
    stats: initialStats
}) => {
    const [analyticsData, setAnalyticsData] = React.useState<any>(null);
    const [detailedReport, setDetailedReport] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [transactionAnalytics, setTransactionAnalytics] = React.useState<any>(null);
    const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        loadAnalytics();
    }, []);

    React.useEffect(() => {
        loadTransactionAnalytics();
    }, [selectedDate]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [overview, retention] = await Promise.all([
                api.getAnalyticsOverview(),
                api.getDetailedReports('retention')
            ]);
            setAnalyticsData(overview);
            setDetailedReport(retention);
        } catch (error) {
            logger.error('Analytics load failed:', error, 'AdminAnalytics');
        } finally {
            setLoading(false);
        }
    };

    const loadTransactionAnalytics = async () => {
        try {
            const analytics = await api.getTransactionAnalytics({
                startDate: selectedDate,
                endDate: selectedDate,
                groupBy: 'customer_type'
            });
            setTransactionAnalytics(analytics);
        } catch (error) {
            logger.error('Transaction analytics load failed:', error, 'AdminAnalytics');
        }
    };

    const handleExport = async (entity: 'bookings' | 'orders' | 'users') => {
        try {
            toast.info(`Exporting ${entity}...`);
            const { csv, filename } = await api.exportData(entity, 'csv');

            // Create Blob and download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success(`${entity} exported successfully!`);
        } catch (error) {
            logger.error('Export failed:', error, 'AdminAnalytics');
            toast.error('Export failed. Please try again.');
        }
    };

    // Use server stats if available, else fall back to props
    const displayStats = analyticsData?.stats || initialStats;
    const topServices = analyticsData?.charts?.topServices || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative bg-glass-card p-8 rounded-3xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <BarChart3 size={24} />
                        </span>
                        Analytics Dashboard
                    </h2>
                    <p className="text-subtle-text text-sm">Real-time business insights and performance metrics</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-glass-card rounded-3xl border border-white/10 p-6 hover:border-gold/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{users.length}</h3>
                    <p className="text-subtle-text text-sm uppercase tracking-wider font-bold">Total Users</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                        <span className="text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +12%</span> vs last month
                    </div>
                </div>

                <div className="bg-glass-card rounded-3xl border border-white/10 p-6 hover:border-gold/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag size={64} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{products.length}</h3>
                    <p className="text-subtle-text text-sm uppercase tracking-wider font-bold">Products</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                        <span className="text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +5%</span> new items
                    </div>
                </div>

                <div className="bg-glass-card rounded-3xl border border-white/10 p-6 hover:border-gold/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={64} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{bookings.length}</h3>
                    <p className="text-subtle-text text-sm uppercase tracking-wider font-bold">Total Bookings</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                        <span className="text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +8%</span> conversion rate
                    </div>
                </div>

                <div className="bg-glass-card rounded-3xl border border-white/10 p-6 hover:border-gold/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package size={64} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{orders.length}</h3>
                    <p className="text-subtle-text text-sm uppercase tracking-wider font-bold">Total Orders</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                        <span className="text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +15%</span> sales growth
                    </div>
                </div>
            </div>

            {/* Detailed Insights */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Recent Activity */}
                <div className="bg-glass-card rounded-3xl border border-white/10 p-8 hover:border-gold/30 transition-all">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Clock size={18} className="text-gold" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Pending Bookings</span>
                            <span className="text-white font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs border border-yellow-500/20">
                                {bookings.filter(b => b.status === 'pending').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Confirmed Bookings</span>
                            <span className="text-white font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs border border-green-500/20">
                                {bookings.filter(b => b.status === 'confirmed').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Active Customers</span>
                            <span className="text-white font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-xs border border-blue-500/20">
                                {users.filter(u => u.role === 'customer').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Staff Members</span>
                            <span className="text-white font-bold bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg text-xs border border-purple-500/20">
                                {users.filter(u => u.role === 'barber').length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Order Insights */}
                <div className="bg-glass-card rounded-3xl border border-white/10 p-8 hover:border-gold/30 transition-all">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Package size={18} className="text-gold" />
                        Order Insights
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Pending Orders</span>
                            <span className="text-white font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs border border-yellow-500/20">
                                {orders.filter(o => o.status === 'pending').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Shipped Orders</span>
                            <span className="text-white font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-xs border border-blue-500/20">
                                {orders.filter(o => o.status === 'shipped').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Delivered Orders</span>
                            <span className="text-white font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs border border-green-500/20">
                                {orders.filter(o => o.status === 'delivered').length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-subtle-text text-sm">Total Revenue</span>
                            <span className="text-gold font-bold font-mono">
                                ${orders.reduce((sum, order) => sum + (order.totalPrice || order.total_amount || 0), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-glass-card rounded-3xl border border-white/10 p-8 hover:border-gold/30 transition-all">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <DollarSign size={18} className="text-gold" />
                        Financial Overview
                    </h3>
                    <div className="space-y-6">
                        <div className="text-center p-6 bg-gradient-to-br from-gold/20 to-transparent rounded-2xl border border-gold/20">
                            <p className="text-subtle-text text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</p>
                            <h4 className="text-3xl font-serif font-bold text-white">
                                ${(displayStats.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-subtle-text text-sm">Weekly Growth</span>
                                <span className={`font-bold flex items-center gap-1 ${Number(displayStats.weeklyGrowth) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {Number(displayStats.weeklyGrowth) >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                                    {Number(displayStats.weeklyGrowth) >= 0 ? '+' : ''}{displayStats.weeklyGrowth}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-subtle-text text-sm">Avg. Order Value</span>
                                <span className="text-white font-bold font-mono">
                                    ${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.totalPrice || o.total_amount || 0), 0) / orders.length).toFixed(2) : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-glass-card rounded-3xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-gold" />
                        Top Services
                    </h3>
                    <AnalysisBarChart data={topServices} xAxisKey="name" />
                </div>

                <div className="bg-glass-card rounded-3xl border border-white/10 p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <PieIcon size={18} className="text-gold" />
                        Customer Retention
                    </h3>
                    {detailedReport?.overview ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="space-y-4 text-center">
                                <div className="flex justify-center gap-8">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{detailedReport.overview.single}</p>
                                        <p className="text-xs text-subtle-text">One-time</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gold">{detailedReport.overview.repeat}</p>
                                        <p className="text-xs text-subtle-text">Returning</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-sm text-subtle-text">Retention Rate</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        {Number(detailedReport.retentionRate || 0).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-subtle-text">Loading retention data...</div>
                    )}
                </div>
            </div>

            {/* Walk-in & Transaction Analytics Section */}
            <div className="bg-glass-card rounded-3xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserCheck size={18} className="text-gold" />
                        Walk-in & Transaction Analytics
                    </h3>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold transition-colors"
                    />
                </div>

                {/* Daily Revenue Breakdown */}
                <div className="mb-8">
                    <h4 className="text-md font-semibold text-white mb-4">Daily Revenue Breakdown</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-subtle-text font-medium">Type</th>
                                    <th className="text-right py-3 px-4 text-subtle-text font-medium">Count</th>
                                    <th className="text-right py-3 px-4 text-subtle-text font-medium">Revenue</th>
                                    <th className="text-right py-3 px-4 text-subtle-text font-medium">% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td className="py-4 px-4 text-white">Booked Customers</td>
                                    <td className="py-4 px-4 text-right text-white font-mono">
                                        {transactionAnalytics?.breakdown?.bookings?.count || 0}
                                    </td>
                                    <td className="py-4 px-4 text-right text-white font-mono font-bold">
                                        ${(transactionAnalytics?.breakdown?.bookings?.revenue || 0).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-right text-subtle-text">
                                        {transactionAnalytics?.breakdown?.total?.revenue > 0
                                            ? ((transactionAnalytics.breakdown.bookings.revenue / transactionAnalytics.breakdown.total.revenue) * 100).toFixed(1)
                                            : 0}%
                                    </td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-4 px-4 text-white">Walk-in Customers</td>
                                    <td className="py-4 px-4 text-right text-white font-mono">
                                        {transactionAnalytics?.breakdown?.walkIns?.count || 0}
                                    </td>
                                    <td className="py-4 px-4 text-right text-white font-mono font-bold">
                                        ${(transactionAnalytics?.breakdown?.walkIns?.revenue || 0).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-right text-subtle-text">
                                        {transactionAnalytics?.breakdown?.total?.revenue > 0
                                            ? ((transactionAnalytics.breakdown.walkIns.revenue / transactionAnalytics.breakdown.total.revenue) * 100).toFixed(1)
                                            : 0}%
                                    </td>
                                </tr>
                                <tr className="bg-gold/10 border-t-2 border-gold">
                                    <td className="py-4 px-4 text-gold font-bold">TOTAL</td>
                                    <td className="py-4 px-4 text-right text-gold font-mono font-bold">
                                        {transactionAnalytics?.breakdown?.total?.count || 0}
                                    </td>
                                    <td className="py-4 px-4 text-right text-gold font-mono font-bold text-lg">
                                        ${(transactionAnalytics?.breakdown?.total?.revenue || 0).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-right text-gold font-bold">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Frequent Walk-ins */}
                <div>
                    <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-gold" />
                        Frequent Walk-in Customers (Top 5)
                    </h4>
                    {!transactionAnalytics?.frequentWalkIns || transactionAnalytics.frequentWalkIns.length === 0 ? (
                        <div className="text-center py-8 text-subtle-text">
                            <UserCheck size={48} className="mx-auto mb-2 opacity-30" />
                            <p>No walk-in data available for selected date</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-subtle-text font-medium">Rank</th>
                                            <th className="text-left py-3 px-4 text-subtle-text font-medium">Name</th>
                                            <th className="text-left py-3 px-4 text-subtle-text font-medium">Phone</th>
                                            <th className="text-right py-3 px-4 text-subtle-text font-medium">Total Visits</th>
                                            <th className="text-right py-3 px-4 text-subtle-text font-medium">Total Spent</th>
                                            <th className="text-right py-3 px-4 text-subtle-text font-medium">Last Visit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactionAnalytics.frequentWalkIns.map((customer: any, index: number) => (
                                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-4 text-gold font-bold text-lg">#{index + 1}</td>
                                                <td className="py-4 px-4 text-white font-medium">{customer.customer_name}</td>
                                                <td className="py-4 px-4 text-subtle-text font-mono">{customer.customer_phone}</td>
                                                <td className="py-4 px-4 text-right text-white">
                                                    <span className="px-3 py-1 bg-gold/20 text-gold rounded-lg font-bold">
                                                        {customer.visit_count}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right text-white font-mono font-bold">
                                                    ${customer.total_spent.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-4 text-right text-subtle-text text-sm">
                                                    {new Date(customer.last_visit).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 p-4 bg-gold/10 border border-gold/30 rounded-xl">
                                <p className="text-gold text-sm">
                                    <TrendingUp size={16} className="inline mr-2" />
                                    <strong>Marketing Tip:</strong> Consider targeting these frequent walk-ins with booking incentives or loyalty programs to increase retention!
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-glass-card rounded-3xl border border-white/10 p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Download size={18} className="text-gold" />
                    Data Export
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => handleExport('bookings')} className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <Calendar className="text-gold group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">Export Bookings (CSV)</span>
                    </button>
                    <button onClick={() => handleExport('orders')} className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <Package className="text-gold group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">Export Orders (CSV)</span>
                    </button>
                    <button onClick={() => handleExport('users')} className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
                        <Users className="text-gold group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">Export Users (CSV)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
