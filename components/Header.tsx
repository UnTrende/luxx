import React, { useState, useEffect, useRef } from 'react';
import { resolveImageUrl } from '../services/imageResolver';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Scissors, LogOut, Menu, X, Bell, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: isAuthLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, isLoading: isNotifLoading } = useNotifications();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);

  const activeLinkStyle = {
    color: '#D4E79E',
    fontWeight: '600',
  };

  // Close dropdowns if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);
  
  useEffect(() => {
    if (!isSettingsLoading && settings) {
      if (settings.site_logo) {
        // Safe JSON parsing
        let siteLogo = settings.site_logo;
        try {
          // If it's a string that might be JSON, parse it
          if (typeof siteLogo === 'string' && siteLogo.startsWith('{')) {
            siteLogo = JSON.parse(siteLogo);
          }
        } catch (parseError) {
          console.warn('Logo parsing failed, using raw value:', siteLogo);
        }
        setLogoUrl(siteLogo);
      } else {
        // Fallback to localStorage with safe parsing
        const logoString = localStorage.getItem('siteLogo');
        if (logoString) {
          try {
            setLogoUrl(JSON.parse(logoString));
          } catch {
            setLogoUrl(logoString); // Use as raw string if parsing fails
          }
        }
      }
    }
  }, [settings, isSettingsLoading]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };
  
  const handleBookNow = () => {
    if (user) {
      navigate('/barbers');
    } else {
      // Preserve the intended destination when redirecting to login
      navigate('/login', { state: { from: '/barbers' } });
    }
  };
  
  const getStyle = ({ isActive }: { isActive: boolean }) => isActive ? activeLinkStyle : undefined;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NotificationBell = () => (
    <div className="relative" ref={notifRef}>
        <button onClick={() => setIsNotifOpen(prev => !prev)} className="relative hover:text-lime-accent transition-colors">
            <Bell size={24} />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                </span>
            )}
        </button>
        {isNotifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-charcoal-card border border-dark-text rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-dark-text font-semibold">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                    {isNotifLoading && <p className="p-4 text-center text-sm text-subtle-text">Loading...</p>}
                    {!isNotifLoading && notifications.length === 0 && <p className="p-4 text-center text-sm text-subtle-text">No notifications yet.</p>}
                    {notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-dark-text text-sm ${!n.is_read ? 'bg-dark-text/50' : ''}`}>
                            <p>{n.message}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-subtle-text">{new Date(n.created_at).toLocaleString()}</p>
                                {!n.is_read && (
                                    <button onClick={() => markAsRead(n.id)} className="text-xs flex items-center gap-1 text-lime-accent hover:underline">
                                        <Check size={14}/> Mark as read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );

  const NavLinks = () => {
    if (isAuthLoading) return null;

    return (
      <>
        {user?.role === 'customer' && (
          <>
            <NavLink to="/my-bookings" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Dashboard</NavLink>
            <NavLink to="/my-orders" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>My Orders</NavLink>
            <NavLink to="/profile" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Profile</NavLink>
          </>
        )}
        {user?.role === 'barber' && (
          <NavLink to="/barber-admin" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>My Panel</NavLink>
        )}
        {user?.role === 'admin' && (
           <>
            <NavLink to="/" end style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Home</NavLink>
            <NavLink to="/admin" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Admin</NavLink>
          </>
        )}
        {!user && (
          <>
            <NavLink to="/" end style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Home</NavLink>
            <NavLink to="/barbers" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Barbers</NavLink>
            <NavLink to="/products" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Products</NavLink>
            <NavLink to="/login" style={getStyle} className="hover:text-lime-accent transition-colors" onClick={closeMobileMenu}>Login</NavLink>
          </>
        )}
      </>
    );
  };

  return (
    <header className="bg-charcoal-card sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-lime-accent" onClick={closeMobileMenu}>
          {logoUrl ? (
            <img src={logoUrl} alt="LuxeCut Logo" className="h-10 md:h-12 max-w-40 object-contain" />
          ) : (
            <>
              <Scissors size={28} />
              <span className="hidden sm:inline">LuxeCut</span>
            </>
          )}
        </Link>
        
        <div className="hidden md:flex items-center space-x-6 text-lg">
          <NavLinks />
          {!isAuthLoading && user && (
            <div className="flex items-center gap-6">
              <NotificationBell />
              <button onClick={handleLogout} className="flex items-center gap-2 hover:text-lime-accent transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          )}
          {!user && (
            <button onClick={handleBookNow} className="bg-lime-accent text-dark-text font-bold py-2 px-6 rounded-lg hover:brightness-110 transition-transform transform hover:scale-105">
              Book Now
            </button>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          {!isAuthLoading && user && <NotificationBell />}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-charcoal-card border-t border-dark-text z-40">
            <div className="container mx-auto px-6 py-4 flex flex-col items-center space-y-4 text-lg">
              <NavLinks />
              {!user ? (
                 <button onClick={() => {handleBookNow(); closeMobileMenu();}} className="w-full bg-lime-accent text-dark-text font-bold py-3 px-6 rounded-lg hover:brightness-110">
                    Book Now
                 </button>
              ) : (
                 <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-semibold text-lime-accent border-2 border-lime-accent hover:bg-lime-accent/10">
                    <LogOut size={20} /> Logout
                </button>
              )}
            </div>
        </div>
      )}
    </header>
  );
};

export default Header;