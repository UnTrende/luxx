import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Service } from '../types';
import { ArrowLeft, Gift, Lock, Sparkles, Star, Trophy, Zap } from 'lucide-react';

const RewardsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: loggedInUser, isLoading } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !loggedInUser) {
            navigate('/login');
            return;
        }

        fetchRewardsData();
    }, [loggedInUser, isLoading, navigate]);

    const fetchRewardsData = async () => {
        try {
            setLoading(true);
            
            // Fetch all services
            const servicesData = await api.getServices();
            
            // Filter only redeemable services
            const redeemableServices = servicesData.filter(s => s.is_redeemable);
            setServices(redeemableServices);

            // Fetch user's current points
            const loyaltyStats = await api.getLoyaltyStats();
            setUserPoints(loyaltyStats?.redeemablePoints || 0);
        } catch (err) {
            setError('Failed to load rewards');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemService = (service: Service) => {
        const pointsNeeded = service.redemption_points || 0;
        
        if (userPoints < pointsNeeded) {
            // Show how many more points needed
            alert(`You need ${pointsNeeded - userPoints} more points to redeem this service.`);
            return;
        }

        // Navigate directly to barbers page with reward booking context
        // Service is already selected, user just needs to pick barber and time
        navigate('/barbers', { 
            state: { 
                isRewardBooking: true,
                preselectedServiceId: service.id,
                pointsToRedeem: pointsNeeded,
                rewardServiceName: service.name
            } 
        });
    };

    const canAfford = (pointsCost: number) => userPoints >= pointsCost;

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-midnight flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mb-4"></div>
                    <p className="text-subtle-text">Loading rewards...</p>
                </div>
            </div>
        );
    }

    if (!loggedInUser) {
        return <div className="text-center p-10 text-subtle-text">Please log in to view rewards.</div>;
    }

    return (
        <div className="min-h-screen bg-midnight pt-8 pb-32 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                            <Gift className="text-gold" size={32} />
                            Redeem Rewards
                        </h1>
                        <p className="text-subtle-text mt-1">Use your points to book services for FREE</p>
                    </div>
                </div>

                {/* Points Balance Card */}
                <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/30 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gold uppercase tracking-widest font-bold mb-2">Your Points Balance</p>
                                <h2 className="text-6xl font-bold text-white flex items-baseline gap-2">
                                    {userPoints}
                                    <span className="text-xl text-gold">pts</span>
                                </h2>
                            </div>
                            <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
                                <Star className="text-gold" size={40} fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Available Rewards */}
                <div>
                    <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                        <Trophy className="text-gold" size={24} />
                        Available Rewards
                    </h3>

                    {services.length === 0 ? (
                        <div className="text-center py-16 bg-glass-card border border-white/5 rounded-3xl">
                            <Gift size={48} className="text-subtle-text/30 mx-auto mb-4" />
                            <p className="text-subtle-text text-lg">No rewards available yet</p>
                            <p className="text-sm text-subtle-text/70 mt-2">
                                Check back soon for exciting rewards!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {services.map((service) => {
                                const pointsCost = service.redemption_points || 0;
                                const affordable = canAfford(pointsCost);
                                const pointsNeeded = affordable ? 0 : pointsCost - userPoints;

                                return (
                                    <div
                                        key={service.id}
                                        className={`relative bg-glass-card border rounded-3xl p-6 transition-all duration-300 ${
                                            affordable
                                                ? 'border-gold/50 hover:border-gold hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] cursor-pointer'
                                                : 'border-white/10 opacity-60'
                                        }`}
                                        onClick={() => affordable && handleRedeemService(service)}
                                    >
                                        {/* Service Image */}
                                        {service.image_url && (
                                            <div className="mb-4 rounded-2xl overflow-hidden h-40 relative">
                                                <img
                                                    src={service.image_url}
                                                    alt={service.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                {!affordable && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                        <Lock className="text-white" size={32} />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Service Info */}
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-xl font-bold text-white">{service.name}</h4>
                                                    <p className="text-sm text-subtle-text">{service.category} • {service.duration} min</p>
                                                </div>
                                                {!affordable && (
                                                    <div className="bg-red-500/20 border border-red-500/50 rounded-full p-2">
                                                        <Lock className="text-red-400" size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Points Cost */}
                                            <div className={`flex items-center justify-between p-4 rounded-xl ${
                                                affordable ? 'bg-gold/10 border border-gold/30' : 'bg-white/5 border border-white/10'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    <Star className={affordable ? 'text-gold' : 'text-subtle-text'} size={20} fill="currentColor" />
                                                    <span className={`text-2xl font-bold ${affordable ? 'text-gold' : 'text-subtle-text'}`}>
                                                        {pointsCost}
                                                    </span>
                                                    <span className={affordable ? 'text-gold/70' : 'text-subtle-text/70'}>points</span>
                                                </div>
                                                <div className="text-sm text-subtle-text line-through">
                                                    ${service.price}
                                                </div>
                                            </div>

                                            {/* Action Button/Status */}
                                            {affordable ? (
                                                <button className="w-full bg-gold text-black py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-white transition-all flex items-center justify-center gap-2">
                                                    <Sparkles size={18} />
                                                    Redeem Now
                                                </button>
                                            ) : (
                                                <div className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-center">
                                                    <p className="text-sm text-red-400 font-medium">
                                                        Need {pointsNeeded} more points
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sparkle Effect for Affordable Rewards */}
                                        {affordable && (
                                            <div className="absolute top-4 right-4">
                                                <Zap className="text-gold animate-pulse" size={24} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* How It Works */}
                <div className="bg-glass-card border border-white/10 rounded-3xl p-8">
                    <h3 className="text-xl font-serif font-bold text-white mb-6">How Rewards Work</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold flex items-center justify-center flex-shrink-0">
                                <span className="text-gold font-bold">1</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Earn Points</h4>
                                <p className="text-sm text-subtle-text">Complete bookings to earn loyalty points based on your tier</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold flex items-center justify-center flex-shrink-0">
                                <span className="text-gold font-bold">2</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Choose Your Reward</h4>
                                <p className="text-sm text-subtle-text">Browse available services and see which ones you can afford</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold flex items-center justify-center flex-shrink-0">
                                <span className="text-gold font-bold">3</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Book for FREE</h4>
                                <p className="text-sm text-subtle-text">Redeem your points and book the service - completely free, no payment required!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardsPage;
