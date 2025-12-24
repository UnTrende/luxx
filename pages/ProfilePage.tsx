import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, LogOut, CreditCard, Settings, HelpCircle, Shield, Star, Calendar, Scissors, TrendingUp, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { BookingWithDetails, LoyaltyStats, OrderWithDetails } from '../types';
import OrderTracking from '../components/OrderTracking';
import { logger } from '../src/lib/logger';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: loggedInUser, isLoading, signOut } = useAuth();

    // State for real booking count and loyalty stats
    const [bookingCount, setBookingCount] = useState<number>(0);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
    const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(true);
    const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    useEffect(() => {
        if (!isLoading && !loggedInUser) {
            navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
        }
    }, [loggedInUser, isLoading, navigate, location]);

    // Fetch real booking count and loyalty stats using existing APIs
    useEffect(() => {
        if (loggedInUser) {
            const fetchData = async () => {
                try {
                    // Fetch bookings count
                    setIsLoadingBookings(true);
                    const bookings = await api.getMyBookings();
                    setBookingCount(bookings.length);
                } catch (error) {
                    logger.error('Error fetching bookings count:', error, 'ProfilePage');
                    setBookingCount(0);
                } finally {
                    setIsLoadingBookings(false);
                }

                try {
                    // Fetch loyalty stats
                    setIsLoadingLoyalty(true);
                    const stats = await api.getLoyaltyStats();
                    setLoyaltyStats(stats);
                } catch (error) {
                    logger.error('Error fetching loyalty stats:', error, 'ProfilePage');
                    setLoyaltyStats(null);
                } finally {
                    setIsLoadingLoyalty(false);
                }

                try {
                    // Fetch recent orders (limit to 3 most recent)
                    setIsLoadingOrders(true);
                    const orders = await api.getMyOrders();
                    const sortedOrders = orders.sort((a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    setRecentOrders(sortedOrders.slice(0, 3));
                } catch (error) {
                    logger.error('Error fetching recent orders:', error, 'ProfilePage');
                    setRecentOrders([]);
                } finally {
                    setIsLoadingOrders(false);
                }
            };
            fetchData();
        }
    }, [loggedInUser]);

    if (isLoading || !loggedInUser) {
        return <div className="text-center p-10 text-subtle-text">Loading profile...</div>;
    }

    // Real Stats (with actual booking count and loyalty data)
    // Format points with commas for better readability
    const formatPoints = (points: number) => {
        return points.toLocaleString();
    };

    const stats = [
        {
            label: 'Bookings',
            value: isLoadingBookings ? '...' : bookingCount.toString(),
            icon: <Calendar size={14} />
        },
        {
            label: 'Points',
            value: isLoadingLoyalty ? '...' : formatPoints(loyaltyStats?.redeemablePoints || 0),
            icon: <Star size={14} />
        },
        {
            label: 'Status',
            value: isLoadingLoyalty ? '...' : (loyaltyStats?.statusTier || 'Silver'),
            icon: <Shield size={14} />
        },
    ];

    // Action Grid Items with navigation handlers
    const actions = [
        { label: 'Edit Profile', icon: <User size={24} />, path: '/profile/edit', onClick: () => navigate('/profile/edit') },
        { label: 'Payment', icon: <CreditCard size={24} />, path: '/profile/payment', onClick: () => navigate('/profile/payment') },
        { label: 'Settings', icon: <Settings size={24} />, path: '/profile/settings', onClick: () => navigate('/profile/settings') },
        { label: 'Support', icon: <HelpCircle size={24} />, path: '/profile/support', onClick: () => navigate('/profile/support') },
    ];

    return (
        <div className="min-h-screen bg-midnight pt-8 pb-32 px-6">
            <div className="max-w-lg mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white">My Suite</h1>
                        <p className="text-subtle-text text-xs uppercase tracking-widest">Welcome back, {loggedInUser.name.split(' ')[0]}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gold-gradient p-[2px]">
                        <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center">
                            <span className="text-gold font-bold text-lg">{loggedInUser.name.charAt(0)}</span>
                        </div>
                    </div>
                </div>

                {/* The Black Card */}
                <div className="relative w-full aspect-[1.586/1] bg-gradient-to-br from-[#1a1a1a] to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-glow">
                    {/* Metallic Shine */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />

                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                    <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-8 rounded bg-gradient-to-r from-yellow-200 to-yellow-500 opacity-90 shadow-sm" />
                            <div className="flex items-center gap-2">
                                <Scissors size={16} className="text-gold/50" />
                                <span className="text-xs font-bold text-gold/80 tracking-widest uppercase">LuxeCut VIP</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-lg font-mono text-white/80 tracking-widest mb-4 drop-shadow-md">
                                •••• •••• •••• 8842
                            </p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Cardholder</p>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">{loggedInUser.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Valid Thru</p>
                                    <p className="text-sm font-bold text-white">12/28</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-3 gap-4">
                    {stats.map((stat, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                if (stat.label === 'Points' || stat.label === 'Status') {
                                    navigate('/profile/rewards');
                                }
                            }}
                            className={`bg-glass-card border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 backdrop-blur-md transition-all ${(stat.label === 'Points' || stat.label === 'Status') ? 'hover:border-gold/30 cursor-pointer' : 'cursor-default'
                                }`}
                        >
                            <div className="text-gold opacity-80">{stat.icon}</div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                                <p className="text-[10px] text-subtle-text uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Loyalty Progress (shown when not loading and has next tier) */}
                {!isLoadingLoyalty && loyaltyStats && loyaltyStats.statusTier !== 'Platinum' && (
                    <div className="bg-glass-card border border-white/5 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-gold" />
                                <h3 className="text-white font-medium text-sm">Progress to {loyaltyStats.nextTier}</h3>
                            </div>
                            <span className="text-xs text-subtle-text">
                                {loyaltyStats.progressToNextTier}% complete
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gold-gradient transition-all duration-500"
                                style={{
                                    width: `${loyaltyStats.progressToNextTier}%`
                                }}
                            />
                        </div>

                        {/* Visits to Next Tier - FILLING LINE COMPONENT */}
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-subtle-text">Visits to next tier</span>
                                <span className="text-sm font-bold text-gold">
                                    {loyaltyStats.statusTier === 'Silver' 
                                        ? Math.max(0, 100 - loyaltyStats.totalConfirmedVisits) 
                                        : loyaltyStats.statusTier === 'Gold' 
                                        ? Math.max(0, 200 - loyaltyStats.totalConfirmedVisits) 
                                        : 0} visits
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                <div 
                                    className="bg-gold h-1.5 rounded-full" 
                                    style={{ 
                                        width: `${loyaltyStats.statusTier === 'Silver' 
                                            ? Math.min(100, (loyaltyStats.totalConfirmedVisits / 100) * 100) 
                                            : loyaltyStats.statusTier === 'Gold' 
                                            ? Math.min(100, (loyaltyStats.totalConfirmedVisits / 200) * 100) 
                                            : 100}%` 
                                    }}
                                ></div>
                            </div>
                            <div className="text-[10px] text-subtle-text mt-1">
                                {loyaltyStats.statusTier === 'Silver' 
                                    ? `Complete ${Math.max(0, 100 - loyaltyStats.totalConfirmedVisits)} more visits for Gold tier` 
                                    : loyaltyStats.statusTier === 'Gold' 
                                    ? `Complete ${Math.max(0, 200 - loyaltyStats.totalConfirmedVisits)} more visits for Platinum tier` 
                                    : 'You\'ve reached the highest tier!'}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-subtle-text">
                                {loyaltyStats.totalConfirmedVisits} visits completed
                            </span>
                            <span className="text-gold font-bold">
                                {loyaltyStats.statusTier === 'Silver' ? '100 visits for Gold' : '200 visits for Platinum'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Max Tier Achieved */}
                {!isLoadingLoyalty && loyaltyStats && loyaltyStats.statusTier === 'Platinum' && (
                    <div className="bg-gradient-to-r from-purple-900/20 to-gold/20 border border-gold/30 rounded-2xl p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Shield size={20} className="text-gold" />
                            <h3 className="text-gold font-serif font-bold text-lg">Platinum Status</h3>
                        </div>
                        <p className="text-xs text-subtle-text">You've reached the highest tier!</p>
                        
                        {/* Visit Summary - FILLING LINE COMPONENT FOR PLATINUM */}
                        <div className="bg-white/5 rounded-lg p-3 mt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-subtle-text">Total visits completed</span>
                                <span className="text-sm font-bold text-gold">
                                    {loyaltyStats.totalConfirmedVisits} visits
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                <div 
                                    className="bg-gold h-1.5 rounded-full" 
                                    style={{ width: '100%' }}
                                ></div>
                            </div>
                            <div className="text-[10px] text-subtle-text mt-1">
                                Enjoy exclusive Platinum benefits
                            </div>
                        </div>
                        
                        {/* Points Summary - Additional FILLING LINE COMPONENT FOR PLATINUM */}
                        <div className="bg-white/5 rounded-lg p-3 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-subtle-text">Redeemable points</span>
                                <span className="text-sm font-bold text-gold">
                                    {loyaltyStats.redeemablePoints.toLocaleString()} pts
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                <div 
                                    className="bg-gold h-1.5 rounded-full" 
                                    style={{ width: '100%' }}
                                ></div>
                            </div>
                            <div className="text-[10px] text-subtle-text mt-1">
                                Use your points for discounts and rewards
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Tracking Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Package size={20} className="text-gold" />
                            <h3 className="text-white font-serif font-bold text-lg">Recent Orders</h3>
                        </div>
                        {!isLoadingOrders && recentOrders.length > 0 && (
                            <button
                                onClick={() => navigate('/my-orders')}
                                className="text-gold text-sm hover:text-gold/80 transition-colors"
                            >
                                View All
                            </button>
                        )}
                    </div>

                    {isLoadingOrders ? (
                        <div className="bg-glass-card border border-white/5 rounded-2xl p-8 text-center">
                            <p className="text-subtle-text text-sm">Loading orders...</p>
                        </div>
                    ) : recentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <OrderTracking key={order.id} order={order} compact={true} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-glass-card border border-white/5 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                                <Package size={32} className="text-gold/50" />
                            </div>
                            <p className="text-white font-medium mb-1">No Orders Yet</p>
                            <p className="text-subtle-text text-xs mb-4">
                                Browse our premium grooming products
                            </p>
                            <button
                                onClick={() => navigate('/products')}
                                className="px-6 py-2 bg-gold text-midnight font-bold rounded-xl hover:brightness-110 transition-all text-sm"
                            >
                                Shop Now
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Grid */}
                <div>
                    <h3 className="text-white font-serif font-bold mb-4 text-lg">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold/30 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 group"
                            >
                                <div className="text-white group-hover:text-gold transition-colors duration-300 transform group-hover:scale-110">
                                    {action.icon}
                                </div>
                                <span className="text-sm font-medium text-white/80 group-hover:text-white">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;