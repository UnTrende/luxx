
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, LogOut, LayoutDashboard, Calendar, Clock, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BarberRosterCard from '../BarberRosterCard';

const BarberLayout: React.FC = () => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isRosterOpen, setIsRosterOpen] = useState(false);

    // Check if user is authenticated and is a barber
    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'barber') {
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/my-bookings');
            }
        }
    }, [user, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    if (!user || user.role !== 'barber') {
        return null;
    }

    return (
        <div className="min-h-screen bg-midnight text-white font-sans selection:bg-gold selection:text-midnight overflow-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 bg-smoke-dark opacity-40 pointer-events-none z-0" />

            {/* Top Bar - Minimalist */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-midnight/80 backdrop-blur-md z-20 relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center text-midnight shadow-glow">
                        <Scissors size={20} />
                    </div>
                    <div>
                        <h1 className="font-serif text-xl font-bold tracking-wider text-gold">THE ATELIER</h1>
                        <p className="text-[10px] text-subtle-text uppercase tracking-widest">Barber Console</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Live</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-subtle-text hover:text-red-400 transition-colors group"
                    >
                        <span className="text-sm font-medium uppercase tracking-widest group-hover:text-red-400 transition-colors">Logout</span>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="h-[calc(100vh-64px)] relative overflow-y-auto pb-24">
                <Outlet />
            </main>

            {/* Toast Notifications */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                aria-label="Notification Container"
            />

            {/* Roster Modal */}
            {isRosterOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-6 animate-fade-in">
                    <div className="bg-card-bg border border-white/10 p-8 rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setIsRosterOpen(false)}
                            className="absolute top-4 right-4 text-subtle-text hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-serif font-bold text-white">My Roster</h2>
                            <p className="text-subtle-text text-sm">Weekly schedule and shift details.</p>
                        </div>

                        <BarberRosterCard />
                    </div>
                </div>
            )}

            {/* Floating Dock Navigation */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-glass-card border border-white/10 rounded-full shadow-glow flex items-center gap-1 px-2 py-2 backdrop-blur-xl">
                    <NavIcon
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={isActive('/barber-admin')}
                        onClick={() => navigate('/barber-admin')}
                    />
                    <NavIcon
                        icon={<Calendar size={20} />}
                        label="Roster"
                        active={isRosterOpen}
                        onClick={() => setIsRosterOpen(true)}
                    />
                    <NavIcon
                        icon={<Clock size={20} />}
                        label="Appointments"
                        active={isActive('/barber-admin/appointments')}
                        onClick={() => navigate('/barber-admin/appointments')}
                    />
                    <NavIcon
                        icon={<User size={20} />}
                        label="Profile"
                        active={isActive('/barber-admin/profile')}
                        onClick={() => navigate('/barber-admin/profile')}
                    />
                </div>
            </div>
        </div>
    );
};

interface NavIconProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavIcon: React.FC<NavIconProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group ${active ? 'bg-gold text-midnight shadow-glow scale-110' : 'text-subtle-text hover:text-white hover:bg-white/5'
            }`}
    >
        {icon}

        {/* Tooltip */}
        <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-midnight border border-white/10 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {label}
        </span>
    </button>
);

export default BarberLayout;