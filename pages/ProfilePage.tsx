import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, LogOut, CreditCard, Settings, HelpCircle, Shield, Star, Calendar, Scissors } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: loggedInUser, isLoading, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    useEffect(() => {
        if (!isLoading && !loggedInUser) {
            navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
        }
    }, [loggedInUser, isLoading, navigate, location]);

    if (isLoading || !loggedInUser) {
        return <div className="text-center p-10 text-subtle-text">Loading profile...</div>;
    }

    // Mock Stats
    const stats = [
        { label: 'Bookings', value: '12', icon: <Calendar size={14} /> },
        { label: 'Points', value: '2,450', icon: <Star size={14} /> },
        { label: 'Status', value: 'Gold', icon: <Shield size={14} /> },
    ];

    // Action Grid Items
    const actions = [
        { label: 'Edit Profile', icon: <User size={24} />, path: '/profile/edit' },
        { label: 'Payment', icon: <CreditCard size={24} />, path: '/profile/payment' },
        { label: 'Settings', icon: <Settings size={24} />, path: '/profile/settings' },
        { label: 'Support', icon: <HelpCircle size={24} />, path: '/profile/support' },
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
                        <div key={index} className="bg-glass-card border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 backdrop-blur-md">
                            <div className="text-gold opacity-80">{stat.icon}</div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                                <p className="text-[10px] text-subtle-text uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Grid */}
                <div>
                    <h3 className="text-white font-serif font-bold mb-4 text-lg">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {actions.map((action, index) => (
                            <button
                                key={index}
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