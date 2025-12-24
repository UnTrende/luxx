import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Download, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import { logger } from '../../src/lib/logger';

interface DailyBreakdown {
    bookings: { count: number; revenue: number };
    walkIns: { count: number; revenue: number };
    total: { count: number; revenue: number };
}

interface FrequentCustomer {
    customer_name: string;
    customer_phone: string;
    visit_count: number;
    total_spent: number;
    last_visit: string;
}

export function TransactionAnalytics() {
    const [dailyBreakdown, setDailyBreakdown] = useState<DailyBreakdown | null>(null);
    const [frequentWalkIns, setFrequentWalkIns] = useState<FrequentCustomer[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch analytics data
    useEffect(() => {
        fetchAnalytics();
    }, [selectedDate]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const analytics = await api.getTransactionAnalytics({
                startDate: selectedDate,
                endDate: selectedDate,
                groupBy: 'customer_type'
            });

            setDailyBreakdown(analytics.breakdown);
            setFrequentWalkIns(analytics.frequentWalkIns || []);
        } catch (error) {
            logger.error('Error fetching analytics:', error, 'TransactionAnalytics');
            toast.error('Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        try {
            const { data, filename } = await api.exportDailyReport(selectedDate, 'csv');
            
            // Create blob and download
            const blob = new Blob([data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Report downloaded successfully');
        } catch (error) {
            logger.error('Error downloading report:', error, 'TransactionAnalytics');
            toast.error('Failed to download report');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Date Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Transaction Analytics</h2>
                    <p className="text-subtle-text">Daily breakdown and customer insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-glass px-4 py-2 rounded-xl border border-white/10">
                        <Calendar size={20} className="text-gold" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        className="px-4 py-2 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow transition-all flex items-center gap-2"
                    >
                        <Download size={20} />
                        Download Report
                    </button>
                </div>
            </div>

            {/* Daily Revenue Breakdown */}
            <div className="bg-glass p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-gold" />
                    Daily Revenue Breakdown
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-subtle-text font-medium">Type</th>
                                <th className="text-right py-3 px-4 text-subtle-text font-medium">Count</th>
                                <th className="text-right py-3 px-4 text-subtle-text font-medium">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-white/5">
                                <td className="py-4 px-4 text-white">Booked Customers</td>
                                <td className="py-4 px-4 text-right text-white font-mono">
                                    {dailyBreakdown?.bookings.count || 0}
                                </td>
                                <td className="py-4 px-4 text-right text-white font-mono font-bold">
                                    ${(dailyBreakdown?.bookings.revenue || 0).toFixed(2)}
                                </td>
                            </tr>
                            <tr className="border-b border-white/5">
                                <td className="py-4 px-4 text-white">Walk-in Customers</td>
                                <td className="py-4 px-4 text-right text-white font-mono">
                                    {dailyBreakdown?.walkIns.count || 0}
                                </td>
                                <td className="py-4 px-4 text-right text-white font-mono font-bold">
                                    ${(dailyBreakdown?.walkIns.revenue || 0).toFixed(2)}
                                </td>
                            </tr>
                            <tr className="bg-gold/10 border-t-2 border-gold">
                                <td className="py-4 px-4 text-gold font-bold">TOTAL</td>
                                <td className="py-4 px-4 text-right text-gold font-mono font-bold">
                                    {dailyBreakdown?.total.count || 0}
                                </td>
                                <td className="py-4 px-4 text-right text-gold font-mono font-bold text-lg">
                                    ${(dailyBreakdown?.total.revenue || 0).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Frequent Walk-ins */}
            <div className="bg-glass p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-gold" />
                    Frequent Walk-ins (Top 5)
                </h3>

                {frequentWalkIns.length === 0 ? (
                    <div className="text-center py-8 text-subtle-text">
                        <Users size={48} className="mx-auto mb-2 opacity-30" />
                        <p>No walk-in data available yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-subtle-text font-medium">Name</th>
                                    <th className="text-left py-3 px-4 text-subtle-text font-medium">Phone</th>
                                    <th className="text-right py-3 px-4 text-subtle-text font-medium">Visits</th>
                                    <th className="text-right py-3 px-4 text-subtle-text font-medium">Total Spent</th>
                                    <th className="text-right py-3 px-4 text-subtle-text font-medium">Last Visit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {frequentWalkIns.map((customer, index) => (
                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4 text-white font-medium">{customer.customer_name}</td>
                                        <td className="py-4 px-4 text-subtle-text font-mono">{customer.customer_phone}</td>
                                        <td className="py-4 px-4 text-right text-white font-mono">
                                            <span className="px-2 py-1 bg-gold/20 text-gold rounded-lg font-bold">
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
                )}

                {frequentWalkIns.length > 0 && (
                    <div className="mt-4 p-4 bg-gold/10 border border-gold/30 rounded-xl">
                        <p className="text-gold text-sm">
                            <TrendingUp size={16} className="inline mr-2" />
                            <strong>Marketing Tip:</strong> Consider targeting these frequent walk-ins with booking incentives or loyalty programs!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
