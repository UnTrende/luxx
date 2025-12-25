import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, Brush, Scissors } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { logger } from '../src/lib/logger';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp, user, isLoading: isAuthLoading } = useAuth();
    const { settings, isLoading: isSettingsLoading } = useSettings();

    // Check if signup is forced (from booking flow)
    const forceSignup = (location.state as any)?.forceSignup || false;

    const [isLoginMode, setIsLoginMode] = useState(!forceSignup); // Start in signup mode if forced
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [appSettings, setAppSettings] = useState({ allowSignups: true, shopName: 'BARBERSHOP' });

    useEffect(() => {
        logger.info('📍 LoginPage: User state changed', undefined, 'LegacyConsole');

        // Don't redirect while still loading
        if (isAuthLoading) {
            logger.info('📍 LoginPage: Still loading, waiting...', undefined, 'LoginPage');
            return;
        }

        // Redirect if user is already logged in
        if (user) {
            logger.info('📍 LoginPage: User logged in, redirecting based on role', user.role, 'LoginPage');
            // DO NOT log full user object - security risk

            // ALWAYS redirect admin and barber to their dashboards (ignore 'from' path)
            if (user.role === 'admin') {
                logger.info('📍 LoginPage: ✅ ADMIN DETECTED - Redirecting to /admin', undefined, 'LoginPage');
                navigate('/admin', { replace: true });
                return;
            }

            if (user.role === 'barber') {
                logger.info('📍 LoginPage: ✅ BARBER DETECTED - Redirecting to /barber-admin', undefined, 'LoginPage');
                navigate('/barber-admin', { replace: true });
                return;
            }

            // For customers, check if there's a specific path they were trying to access
            const from = (location.state as any)?.from;
            const returnTo = (location.state as any)?.returnTo;
            const barberId = (location.state as any)?.barberId;
            const preselectedServiceId = (location.state as any)?.preselectedServiceId;
            const selectedServices = (location.state as any)?.selectedServices;

            logger.info('📍 LoginPage: Customer login - checking redirect path', undefined, 'LegacyConsole');

            // If returning to booking flow, restore state
            if (returnTo === 'booking' && barberId) {
                logger.info('📍 LoginPage: Returning to booking flow with preserved state', undefined, 'LoginPage');
                navigate(`/book/${barberId}`, {
                    replace: true,
                    state: {
                        preselectedServiceId,
                        selectedServices
                    }
                });
                return;
            }

            if (from && from !== '/login' && from !== '/') {
                logger.info('📍 LoginPage: Redirecting customer to intended path', from, 'LoginPage');
                navigate(from, { replace: true });
            } else {
                logger.info('📍 LoginPage: ⚠️ CUSTOMER ROLE - Redirecting to /my-bookings', undefined, 'LoginPage');
                navigate('/my-bookings', { replace: true });
            }
        }
    }, [user, isAuthLoading, navigate, location.state]);

    useEffect(() => {
        if (!isSettingsLoading && settings) {
            // Safe access with defaults
            const shopName = settings.shop_name || 'BARBERSHOP';
            const allowSignups = settings.allow_signups ?? true;

            setAppSettings({
                shopName: typeof shopName === 'string' ? shopName : 'BARBERSHOP',
                allowSignups: Boolean(allowSignups)
            });

            if (settings.site_logo) {
                // Safe JSON parsing
                let siteLogo = settings.site_logo;
                try {
                    // If it's a string that might be JSON, parse it
                    if (typeof siteLogo === 'string' && siteLogo.startsWith('{')) {
                        siteLogo = JSON.parse(siteLogo);
                    }
                } catch (parseError) {
                    logger.warn('Logo parsing failed, using raw value:', siteLogo, 'LoginPage');
                }
                setLogoUrl(siteLogo);
            }
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

            const settingsString = localStorage.getItem('appSettings');
            if (settingsString) {
                try {
                    setAppSettings(JSON.parse(settingsString));
                } catch {
                    // Use defaults if parsing fails
                    setAppSettings({ shopName: 'BARBERSHOP', allowSignups: true });
                }
            }
        }
    }, [settings, isSettingsLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(''); // Clear previous errors

        try {
            logger.info('📱 LoginPage: Starting authentication...', undefined, 'LoginPage');
            if (isLoginMode) {
                logger.info('📱 LoginPage: Calling signIn...', undefined, 'LoginPage');
                const { error } = await signIn({ email, password });
                logger.info('📱 LoginPage: signIn returned', { error: error?.message }, 'LoginPage');
                if (error) throw error;
            } else {
                if (!appSettings.allowSignups) {
                    throw new Error('New account registrations are currently disabled.');
                }
                logger.info('📱 LoginPage: Calling signUp...', undefined, 'LoginPage');
                const { error } = await signUp({ email, password, name });
                logger.info('📱 LoginPage: signUp returned', { error: error?.message }, 'LoginPage');
                if (error) throw error;
            }
            logger.info('📱 LoginPage: Authentication successful', undefined, 'LoginPage');
        } catch (err: Error | unknown) {
            logger.info('📱 LoginPage: Authentication error caught', err, 'LoginPage');
            // Handle quota exceeded error with user-friendly message
            if (err.name === 'QuotaExceededError' || err.message?.includes('QuotaExceededError') || err.message?.includes('exceeded the quota')) {
                setError('Your browser storage is full. Please follow these steps: 1) Press F12 to open DevTools, 2) Go to Application/Storage tab, 3) Click "Clear storage" or run "localStorage.clear()" in the console, 4) Refresh the page and try again.');
            } else {
                setError(err.message || 'Authentication failed. Please try again.');
            }
        } finally {
            logger.info('📱 LoginPage: Setting loading to false', undefined, 'LoginPage');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-midnight relative overflow-hidden">
            {/* Geometric Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }}></div>

            <div className="w-full max-w-md relative z-10">
                <div className="mx-auto mb-12 flex flex-col items-center justify-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt="LuxeCut Logo" className="h-32 w-auto max-w-xs object-contain mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                    ) : (
                        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                            <Brush size={64} className="text-gold transform -rotate-45 absolute drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" strokeWidth={1.5} />
                            <Scissors size={64} className="text-gold transform rotate-45 absolute scale-x-[-1] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" strokeWidth={1.5} />
                        </div>
                    )}
                    <h1 className="text-4xl font-serif font-bold tracking-widest text-white uppercase">
                        {appSettings.shopName}
                    </h1>
                    <div className="h-[1px] w-24 bg-white/30 mt-4 mb-2"></div>
                    <p className="text-[10px] text-white/70 tracking-[0.3em] uppercase">Premium Grooming</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {!isLoginMode && (
                        <div className="relative group">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-transparent focus:outline-none focus:border-gold transition-colors peer"
                                placeholder="Full Name"
                                id="name"
                            />
                            <label
                                htmlFor="name"
                                className="absolute left-0 top-3 text-subtle-text text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-gold peer-[&:not(:placeholder-shown)]:-top-5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-gold cursor-text"
                            >
                                Full Name
                            </label>
                        </div>
                    )}

                    <div className="relative group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-transparent focus:outline-none focus:border-gold transition-colors peer"
                            placeholder="Email Address"
                            id="email"
                        />
                        <label
                            htmlFor="email"
                            className="absolute left-0 top-3 text-subtle-text text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-gold peer-[&:not(:placeholder-shown)]:-top-5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-gold cursor-text"
                        >
                            Email Address
                        </label>
                    </div>

                    <div className="relative group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete={isLoginMode ? "current-password" : "new-password"}
                            className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-transparent focus:outline-none focus:border-gold transition-colors peer"
                            placeholder="Password"
                            id="password"
                        />
                        <label
                            htmlFor="password"
                            className="absolute left-0 top-3 text-subtle-text text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-gold peer-[&:not(:placeholder-shown)]:-top-5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-gold cursor-text"
                        >
                            Password
                        </label>
                    </div>

                    {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">{error}</p>}

                    <div className="pt-8 space-y-6">
                        <button
                            type="submit"
                            disabled={loading || isAuthLoading}
                            className="w-full py-4 rounded-full font-bold text-midnight bg-gold-gradient hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait uppercase tracking-widest text-sm"
                        >
                            {(loading || isAuthLoading) ? 'Processing...' : (isLoginMode ? 'Enter' : 'Join')}
                        </button>

                        {appSettings.allowSignups && !forceSignup && (
                            <button
                                type="button"
                                onClick={() => setIsLoginMode(!isLoginMode)}
                                className="w-full py-2 text-sm text-subtle-text hover:text-gold transition-colors uppercase tracking-wider"
                            >
                                {isLoginMode ? 'Create an Account' : 'Already have an account?'}
                            </button>
                        )}

                        {forceSignup && (
                            <p className="text-center text-xs text-gold/60 mt-4">
                                Please create an account to complete your booking
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;