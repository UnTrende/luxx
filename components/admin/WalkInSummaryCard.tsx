import React, { useState, useEffect } from 'react';
import { UserCheck, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { logger } from '../../src/lib/logger';

interface WalkInSummaryProps {
    onViewDetails: () => void;
}

export const WalkInSummaryCard: React.FC<WalkInSummaryProps> = ({ onViewDetails }) => {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const analytics = await api.getTransactionAnalytics({
                startDate: today,
                endDate: today,
                groupBy: 'customer_type'
            });
            setSummary(analytics);
        } catch (error) {
            logger.error('Failed to load walk-in summary:', error, 'WalkInSummaryCard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-glass p-6 rounded-xl border border-white/10 animate-pulse">
                <div className="h-24 bg-white/5 rounded"></div>
            </div>
        );
    }

    const walkInCount = summary?.breakdown?.walkIns?.count || 0;
    const walkInRevenue = summary?.breakdown?.walkIns?.revenue || 0;
    const totalRevenue = summary?.breakdown?.total?.revenue || 0;
    const walkInPercentage = totalRevenue > 0 ? ((walkInRevenue / totalRevenue) * 100).toFixed(1) : '0';

    return (
        <div 
            className="bg-glass p-6 rounded-xl border border-white/10 hover:border-gold/50 transition-all cursor-pointer group"
            onClick={onViewDetails}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gold/20 rounded-xl group-hover:scale-110 transition-transform">
                        <UserCheck size={24} className="text-gold" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Walk-in Customers</h3>
                        <p className="text-subtle-text text-sm">Today's Performance</p>
                    </div>
                </div>
                <ArrowRight size={20} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Walk-in Count */}
                <div className="bg-white/5 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <UserCheck size={16} className="text-gold" />
                        <span className="text-subtle-text text-xs">Walk-ins Today</span>
                    </div>
                    <div className="text-white font-bold text-2xl">{walkInCount}</div>
                </div>

                {/* Walk-in Revenue */}
                <div className="bg-white/5 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-gold" />
                        <span className="text-subtle-text text-xs">Revenue</span>
                    </div>
                    <div className="text-white font-bold text-2xl">${walkInRevenue.toFixed(2)}</div>
                </div>
            </div>

            {/* Percentage of Total */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <span className="text-subtle-text text-sm">% of Total Revenue</span>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-gold" />
                        <span className="text-gold font-bold text-lg">{walkInPercentage}%</span>
                    </div>
                </div>
            </div>

            {/* Top Walk-in Customer */}
            {summary?.frequentWalkIns && summary.frequentWalkIns.length > 0 && (
                <div className="mt-4 p-3 bg-gold/10 border border-gold/30 rounded-xl">
                    <div className="text-xs text-gold mb-1">🏆 Top Walk-in Customer</div>
                    <div className="text-white font-semibold">{summary.frequentWalkIns[0].customer_name}</div>
                    <div className="text-subtle-text text-xs">
                        {summary.frequentWalkIns[0].visit_count} visits · ${summary.frequentWalkIns[0].total_spent.toFixed(2)} spent
                    </div>
                </div>
            )}

            <div className="mt-4 text-center">
                <button className="text-gold text-sm font-semibold hover:underline flex items-center gap-2 mx-auto group-hover:gap-3 transition-all">
                    View Detailed Analytics
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};
