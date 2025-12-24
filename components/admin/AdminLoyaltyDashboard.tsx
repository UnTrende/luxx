import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, Users, Award, Gift, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
  <div 
    className={`bg-glass-card border border-white/10 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors ${onClick ? 'hover:border-gold/30' : ''}`}
    onClick={onClick}
  >
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-subtle-text text-sm">{title}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

interface AdminLoyaltyDashboardProps {
  showContextBanner?: boolean;
  rewardsContext?: {
    pointsRedeemed: number;
    pointsIssued: number;
    redemptionRate: number;
  };
}

const AdminLoyaltyDashboard: React.FC<AdminLoyaltyDashboardProps> = ({ showContextBanner, rewardsContext }) => {
  const navigate = useNavigate();
  const [bannerVisible, setBannerVisible] = useState(showContextBanner);

  // Fetch real loyalty stats from backend
  const { data: loyaltyData, isLoading, error } = useQuery({
    queryKey: ['admin-loyalty-stats'],
    queryFn: () => api.getAdminLoyaltyStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 2, // Auto-refetch every 2 minutes
  });

  // Use real data or fallback to zeros while loading
  const stats = {
    totalMembers: loyaltyData?.stats?.totalMembers || 0,
    activePoints: loyaltyData?.stats?.activePoints || 0,
    tierDistribution: {
      silver: loyaltyData?.stats?.tierDistribution?.Silver || 0,
      gold: loyaltyData?.stats?.tierDistribution?.Gold || 0,
      platinum: loyaltyData?.stats?.tierDistribution?.Platinum || 0
    },
    recentActivity: loyaltyData?.stats?.recentActivity || 0
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Error Loading Loyalty Stats
        </h3>
        <p className="text-red-600 dark:text-red-300">
          {error instanceof Error ? error.message : 'Failed to load loyalty statistics'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Banner - Shows rewards activity from dashboard */}
      {bannerVisible && rewardsContext && (
        <div className="bg-cyan-500/10 border-l-4 border-cyan-500 p-5 rounded-xl relative animate-slide-down">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Gift className="text-cyan-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">🎁 Rewards Activity This Week</h3>
                <p className="text-cyan-200 text-sm">
                  <span className="font-bold">{rewardsContext.pointsRedeemed} points</span> redeemed by customers for free services.
                  {rewardsContext.pointsIssued > 0 && (
                    <> Redemption rate: <span className="font-bold">{rewardsContext.redemptionRate}%</span></>
                  )}
                </p>
                <p className="text-cyan-200/70 text-xs mt-1">
                  {rewardsContext.pointsIssued} points issued • {rewardsContext.redemptionRate > 50 ? 'High engagement! 🔥' : 'Consider promoting rewards to increase engagement.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setBannerVisible(false)}
              className="text-cyan-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">Loyalty Program</h2>
        <p className="text-subtle-text">Manage your customer rewards program • Real-time data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Members" 
          value={stats.totalMembers} 
          icon={<Users size={24} className="text-blue-400" />} 
          color="bg-blue-500/20" 
        />
        <StatCard 
          title="Active Points" 
          value={stats.activePoints.toLocaleString()} 
          icon={<Star size={24} className="text-yellow-400" />} 
          color="bg-yellow-500/20" 
        />
        <StatCard 
          title="Platinum Members" 
          value={stats.tierDistribution.platinum} 
          icon={<Award size={24} className="text-purple-400" />} 
          color="bg-purple-500/20" 
        />
        <StatCard 
          title="Recent Activity" 
          value={stats.recentActivity} 
          icon={<TrendingUp size={24} className="text-green-400" />} 
          color="bg-green-500/20" 
        />
      </div>

      <div className="bg-glass-card border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Tier Distribution</h3>
          <button 
            onClick={() => navigate('/admin/loyalty-settings')}
            className="px-4 py-2 bg-gold text-black rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
          >
            Manage Settings
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-subtle-text">Silver Tier</span>
              <span className="text-white">{stats.tierDistribution.silver} members</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gray-400 h-2 rounded-full" 
                style={{ width: `${(stats.tierDistribution.silver / stats.totalMembers) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-subtle-text">Gold Tier</span>
              <span className="text-white">{stats.tierDistribution.gold} members</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(stats.tierDistribution.gold / stats.totalMembers) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-subtle-text">Platinum Tier</span>
              <span className="text-white">{stats.tierDistribution.platinum} members</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${(stats.tierDistribution.platinum / stats.totalMembers) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoyaltyDashboard;