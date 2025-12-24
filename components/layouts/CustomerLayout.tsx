import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User, ShoppingBag } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../src/lib/logger';

const CustomerLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();

    // Redirect admin and barber users to their appropriate dashboards
    useEffect(() => {
        logger.debug('CustomerLayout checking user role', {
      userRole: user?.role,
      pathname: location.pathname
    }, 'CustomerLayout');

        // Don't redirect while loading
        if (isLoading) {
            logger.info('🏪 CustomerLayout: Still loading, waiting...', undefined, 'CustomerLayout');
            return;
        }

        // Redirect admins and barbers to their dashboards
        if (user) {
            if (user.role === 'admin') {
                logger.info('🏪 CustomerLayout: ⚠️ Admin user detected, redirecting to /admin', undefined, 'CustomerLayout');
                navigate('/admin', { replace: true });
                return;
            }
            
            if (user.role === 'barber') {
                logger.info('🏪 CustomerLayout: ⚠️ Barber user detected, redirecting to /barber-admin', undefined, 'CustomerLayout');
                navigate('/barber-admin', { replace: true });
                return;
            }
            
            logger.info('🏪 CustomerLayout: ✅ Customer user, allowing access', undefined, 'CustomerLayout');
        } else {
            logger.info('🏪 CustomerLayout: No user logged in, public access allowed', undefined, 'CustomerLayout');
        }
    }, [user, isLoading, navigate, location.pathname]);

    const isActive = (path: string) => {
        // Handle root path specially
        if (path === '/') {
            return location.hash === '' || location.hash === '#/';
        }
        return location.hash === `#${path}`;
    };

    return (
        <div className="min-h-screen bg-dubai-black font-sans text-light-text selection:bg-dubai-gold selection:text-dubai-black overflow-x-hidden">
            {/* Background Texture */}
            <div className="fixed inset-0 bg-smoke-dark opacity-40 pointer-events-none z-0" />

            {/* Main Content Area */}
            <main className="relative z-10 pb-24 min-h-screen animate-fade-in">
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
                aria-label="Notifications"
            />

            {/* Floating Glass Bottom Navigation */}
            <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
                <div className="bg-glass-card border border-white/10 rounded-full shadow-glow flex items-center justify-between px-6 py-3 w-full max-w-md relative">
                    <NavIcon
                        icon={<Home size={20} strokeWidth={1.5} />}
                        label="Home"
                        active={isActive('/')}
                        onClick={() => navigate('/')}
                    />
                    <NavIcon
                        icon={<Calendar size={20} strokeWidth={1.5} />}
                        label="Bookings"
                        active={isActive('/my-bookings')}
                        onClick={() => navigate('/my-bookings')}
                    />

                    {/* Center Action Button - Quick Book */}
                    <div className="relative -top-8 mx-2">
                        <button
                            onClick={() => navigate('/barbers')}
                            className="w-14 h-14 rounded-full bg-gold-gradient shadow-glow flex items-center justify-center transform transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-midnight"
                        >
                            <span className="text-midnight font-serif font-bold text-xl">B</span>
                        </button>
                    </div>

                    <NavIcon
                        icon={<ShoppingBag size={20} strokeWidth={1.5} />}
                        label="Shop"
                        active={isActive('/products')}
                        onClick={() => navigate('/products')}
                    />
                    <NavIcon
                        icon={<User size={20} strokeWidth={1.5} />}
                        label="Profile"
                        active={isActive('/profile')}
                        onClick={() => navigate('/profile')}
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
        className={`flex flex-col items-center gap-1 transition-all duration-300 relative group ${active ? 'text-gold' : 'text-subtle-text hover:text-white'
            }`}
    >
        <div className={`transition-all duration-300 ${active ? 'drop-shadow-[0_0_8px_rgba(229,197,88,0.5)]' : ''}`}>
            {icon}
        </div>
        <span className={`text-[9px] font-medium tracking-widest uppercase transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {label}
        </span>
        {active && (
            <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-gold-text shadow-[0_0_5px_#E5C558]" />
        )}
    </button>
);

export default CustomerLayout;
