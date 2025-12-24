import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../src/lib/logger';
import { logger } from '../../../src/lib/logger';

const AdminLayout: React.FC = () => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user is authenticated and is an admin
    useEffect(() => {
        logger.info('👑 AdminLayout: Checking user role', undefined, 'LegacyConsole');

        if (!user) {
            // If no user, redirect to login
            logger.info('👑 AdminLayout: No user, redirecting to login', undefined, 'AdminLayout');
            navigate('/login');
        } else if (user.role !== 'admin') {
            // If user is not an admin, redirect to appropriate dashboard
            logger.info('👑 AdminLayout: Non-admin user detected, redirecting...', undefined, 'AdminLayout');
            if (user.role === 'barber') {
                logger.info('👑 AdminLayout: Barber user, redirecting to /barber-admin', undefined, 'AdminLayout');
                navigate('/barber-admin');
            } else {
                // For customers, redirect to their dashboard
                logger.info('👑 AdminLayout: Customer user, redirecting to /my-bookings', undefined, 'AdminLayout');
                navigate('/my-bookings');
            }
        } else {
            logger.info('👑 AdminLayout: ✅ Admin user, allowing access', undefined, 'AdminLayout');
        }
    }, [user, navigate, location.pathname]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        // Handle admin root path specially
        if (path === '/admin') {
            return location.hash === '#/admin' || location.hash === '';
        }
        return location.hash === `#${path}`;
    };

    // Don't render the layout if the user is not an admin
    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-dubai-marble font-sans text-dubai-dark-grey selection:bg-dubai-gold selection:text-white flex">
            {/* Sidebar Navigation */}


            {/* Main Content */}
            <main className="flex-1 p-0 overflow-y-auto h-screen">
                <div className="w-full h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

interface AdminNavLinkProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const AdminNavLink: React.FC<AdminNavLinkProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${active
            ? 'bg-dubai-black text-white shadow-lg shadow-dubai-black/10'
            : 'text-subtle-text hover:bg-gray-50 hover:text-dubai-black'
            }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

export default AdminLayout;