import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { Booking, Service, Attendance } from '../types';
import { Calendar, Trash2, CalendarOff, Loader, Clock, User, Scissors, Power, Coffee, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import BarberRosterCard from '../components/BarberRosterCard';
import NotificationCard from '../components/NotificationCard';
import { logger } from '../src/lib/logger';

const BarberDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: loggedInUser, isLoading: isAuthLoading } = useAuth();

    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [hiddenHours, setHiddenHours] = useState<string[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);

    // Generate hourly time slots from 09:00 AM to 05:00 PM
    const timeSlots = useMemo(() => {
        const slots: string[] = [];
        const toLabel = (h: number): string => {
            const period = h >= 12 ? 'PM' : 'AM';
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            const label = `${hour12.toString().padStart(2, '0')}:00 ${period}`;
            return label;
        };
        for (let h = 9; h <= 17; h++) {
            slots.push(toLabel(h));
        }
        return slots;
    }, []);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

    // Cancellation modal state
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
    const [cancelReason, setCancelReason] = useState<string>('');
    const [isCanceling, setIsCanceling] = useState(false);

    // Booking detail modal state
    const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const loadData = useCallback(async () => {
        if (!loggedInUser || loggedInUser.role !== 'barber') return;
        setIsLoadingData(true);
        setIsLoadingAttendance(true);
        try {
            try {
                const attendance = await api.getBarberAttendance();
                setCurrentAttendance(attendance);
            } catch (attendanceError) {
                logger.error("Failed to get attendance:", attendanceError, 'BarberDashboardPage');
            }

            const [schedule, services] = await Promise.all([
                api.getBarberSchedule(),
                api.getServices(),
            ]);
            setMyBookings(schedule);
            setAllServices(services);

            // Load initial hidden hours from DB (barber_settings)
            try {
                const barberId = await api.getBarberIdByUserId(loggedInUser.id);
                if (barberId && api.supabase) {
                    const { data, error } = await api.supabase
                        .from('barber_settings')
                        .select('hidden_hours')
                        .eq('barber_id', barberId)
                        .maybeSingle();
                    if (!error && data && Array.isArray(data.hidden_hours)) {
                        setHiddenHours(data.hidden_hours as string[]);
                    }
                }
            } catch (e) {
                logger.warn('Failed to load initial hidden hours', e, 'BarberDashboardPage');
            }
        } catch (error) {
            logger.error("Failed to load barber dashboard data:", error, 'BarberDashboardPage');
        } finally {
            setIsLoadingData(false);
            setIsLoadingAttendance(false);
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (!loggedInUser || loggedInUser.role !== 'barber') {
                navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
            } else {
                loadData();
            }
        }
    }, [loggedInUser, isAuthLoading, navigate, loadData]); // Removed 'location' to prevent unnecessary reloads

    const upcomingBookings = useMemo(() => {
        return [...myBookings].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    }, [myBookings]);

    const toggleHiddenHour = async (time: string) => {
        const newHiddenHours = hiddenHours.includes(time)
            ? hiddenHours.filter(t => t !== time)
            : [...hiddenHours, time];

        setHiddenHours(newHiddenHours);

        try {
            await api.updateBarberAvailability(newHiddenHours);
            toast.success('Availability updated');
        } catch (error) {
            logger.error("Failed to update availability:", error, 'BarberDashboardPage');
            setHiddenHours(hiddenHours);
            toast.error("Could not update availability. Please try again.");
        }
    };

    const handleCancelClick = (booking: Booking) => {
        setSelectedBookingForCancel(booking);
        setCancelReason('');
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedBookingForCancel || !cancelReason) {
            toast.error("Please provide a reason for cancellation.");
            return;
        }

        setIsCanceling(true);
        try {
            await api.cancelBookingByBarber(selectedBookingForCancel.id, cancelReason);
            setMyBookings((prev) => prev.filter((b) => b.id !== selectedBookingForCancel.id));
            setIsCancelModalOpen(false);
            setSelectedBookingForCancel(null);
        } catch (error) {
            logger.error("Failed to cancel booking:", error, 'BarberDashboardPage');
            toast.error("Error: Could not cancel booking.");
        } finally {
            setIsCanceling(false);
        }
    };

    const handleAttendanceAction = async (action: 'clock-in' | 'clock-out' | 'start-break' | 'end-break') => {
        try {
            const result = await api.updateAttendance(action);
            if (result.success) {
                const updatedAttendance = await api.getBarberAttendance();
                setCurrentAttendance(updatedAttendance);
                toast.success('Action completed');
            } else {
                if (result.message.includes('Already clocked in')) {
                    const updatedAttendance = await api.getBarberAttendance();
                    setCurrentAttendance(updatedAttendance);
                }
                toast.error(`Action failed: ${result.message}`);
            }
        } catch (error) {
            logger.error(`Failed to ${action}:`, error, 'BarberDashboardPage');
            toast.error(`Error: Could not ${action.replace('-', ' ')}.`);
        }
    };

    if (isAuthLoading || isLoadingData) {
        return (
            <div className="h-full flex items-center justify-center bg-midnight">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!loggedInUser) return null;

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-6 bg-midnight text-white overflow-hidden">
            {/* LEFT PANEL - TIMELINE */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 h-full">
                {/* Status Control */}
                <div className="bg-glass-card border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[50px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h2 className="text-subtle-text text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Power size={14} className="text-gold" />
                            System Status
                        </h2>
                        {currentAttendance?.workingHours !== undefined && (
                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gold">
                                {currentAttendance.workingHours.toFixed(2)}h
                            </div>
                        )}
                    </div>

                    {isLoadingAttendance ? (
                        <div className="flex justify-center p-4">
                            <Loader className="animate-spin text-gold" size={24} />
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-sm font-medium text-white/80">Current State</span>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${currentAttendance?.status === 'clocked-in' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                                    currentAttendance?.status === 'on-break' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' :
                                        'border-red-500/30 bg-red-500/10 text-red-400'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentAttendance?.status === 'clocked-in' ? 'bg-green-400' :
                                        currentAttendance?.status === 'on-break' ? 'bg-yellow-400' :
                                            'bg-red-400'
                                        }`} />
                                    {currentAttendance?.status === 'clocked-in' ? 'Online' :
                                        currentAttendance?.status === 'on-break' ? 'Standby' :
                                            'Offline'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {currentAttendance?.status === 'clocked-in' ? (
                                    <>
                                        <button
                                            onClick={() => handleAttendanceAction('start-break')}
                                            className="bg-white/5 border border-white/10 hover:border-yellow-500/50 hover:text-yellow-400 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <Coffee size={14} /> Break
                                        </button>
                                        <button
                                            onClick={() => handleAttendanceAction('clock-out')}
                                            className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <Power size={14} /> Clock Out
                                        </button>
                                    </>
                                ) : currentAttendance?.status === 'on-break' ? (
                                    <button
                                        onClick={() => handleAttendanceAction('end-break')}
                                        className="col-span-2 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <Power size={14} /> Resume
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAttendanceAction('clock-in')}
                                        className="col-span-2 bg-gold-gradient text-midnight py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-glow transition-all flex items-center justify-center gap-2"
                                    >
                                        <Power size={14} /> Initialize System
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Manifest (Timeline) */}
                <div className="flex-1 bg-glass-card border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col relative">
                    <h2 className="text-subtle-text text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Clock size={14} className="text-gold" />
                        Today's Manifest
                    </h2>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {upcomingBookings.length > 0 ? (
                            <div className="space-y-4 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-white/10" />

                                {upcomingBookings.map((booking, idx) => {
                                    const isNext = idx === 0;
                                    return (
                                        <div key={booking.id} className="relative pl-10 group">
                                            {/* Dot Indicator */}
                                            <div className={`absolute left-[16px] top-6 w-[7px] h-[7px] rounded-full z-10 transition-all duration-300 ${isNext ? 'bg-gold box-shadow-glow scale-125' : 'bg-subtle-text ring-4 ring-midnight'
                                                }`} />

                                            <div
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsBookingDetailOpen(true);
                                                }}
                                                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${isNext ? 'bg-white/5 border-gold/30 shadow-lg hover:border-gold/50' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`font-mono font-bold text-lg ${isNext ? 'text-gold' : 'text-white'}`}>
                                                        {booking.timeSlot}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${booking.status === 'confirmed' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-gray-500/30 text-gray-400 bg-gray-500/5'}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <h3 className="font-serif font-bold text-white text-lg mb-1">{booking.userName || 'Guest'}</h3>
                                                <p className="text-subtle-text text-xs mb-3 flex items-center gap-1">
                                                    <Scissors size={12} />
                                                    {booking.serviceIds?.map(id => allServices.find(s => s.id === id)?.name).join(', ') || ''}
                                                </p>

                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleCancelClick(booking)}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={12} /> Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-subtle-text opacity-50">
                                <CalendarOff size={32} className="mb-2" />
                                <p className="text-xs uppercase tracking-widest">No bookings scheduled</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - ACTIVE CLIENT & CONTROLS */}
            <div className="w-full md:w-2/3 flex flex-col gap-6 h-full">
                {/* Now Serving (Large Card) */}
                <div className="flex-1 bg-gradient-to-br from-[#1a1a1a] to-midnight border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-subtle-text text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <User size={14} className="text-gold" />
                                    Now Serving
                                </h2>
                                {upcomingBookings.length > 0 ? (
                                    <h1 className="text-5xl font-serif font-bold text-white mb-2 tracking-tight">
                                        {upcomingBookings[0]?.userName || 'Guest'}
                                    </h1>
                                ) : (
                                    <h1 className="text-4xl font-serif font-bold text-subtle-text/30">Station Idle</h1>
                                )}
                            </div>
                            {upcomingBookings.length > 0 && (
                                <div className="w-12 h-12 rounded-full bg-gold-gradient p-[1px]">
                                    <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center">
                                        <span className="text-gold font-bold text-lg">{(upcomingBookings[0]?.userName || 'G').charAt(0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {upcomingBookings.length > 0 && (
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-subtle-text text-[10px] font-bold uppercase tracking-widest mb-4">Services Requested</h3>
                                    <div className="space-y-3">
                                        {upcomingBookings[0]?.serviceIds?.map(id => (
                                            <div key={id} className="flex items-center gap-3 text-white group/item">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gold group-hover/item:shadow-[0_0_8px_rgba(212,175,55,0.8)] transition-all" />
                                                <span className="text-lg font-light">{allServices.find(s => s.id === id)?.name}</span>
                                            </div>
                                        )) || []}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-subtle-text text-[10px] font-bold uppercase tracking-widest mb-4">Client Notes</h3>
                                    <p className="text-white/80 italic font-serif leading-relaxed">"Prefers a sharp fade. Watch out for the cowlick on the left side. Likes the water warm."</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto">
                            <button
                                className={`w-full h-20 rounded-2xl font-bold text-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${upcomingBookings.length > 0
                                    ? 'bg-gold-gradient text-midnight hover:shadow-glow active:scale-[0.99]'
                                    : 'bg-white/5 text-subtle-text cursor-not-allowed'
                                    }`}
                                disabled={upcomingBookings.length === 0}
                                onClick={() => {
                                    // Animation logic
                                    const btn = document.activeElement as HTMLElement;
                                    btn.classList.add('animate-ripple');
                                    setTimeout(() => btn.classList.remove('animate-ripple'), 600);
                                }}
                            >
                                <CheckCircle size={24} />
                                Complete Service
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="h-1/3 min-h-[250px]">
                    {/* Availability Grid */}
                    <div className="h-full bg-glass-card border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col">
                        <h2 className="text-subtle-text text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={14} className="text-gold" />
                            Availability Override
                        </h2>
                        <div className="grid grid-cols-4 gap-2 h-full overflow-y-auto custom-scrollbar pr-2 content-start">
                            {timeSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => toggleHiddenHour(time)}
                                    className={`py-2 rounded-lg font-mono text-[10px] font-bold transition-all border ${hiddenHours.includes(time)
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20 opacity-50'
                                        : 'bg-white/5 text-white border-white/10 hover:border-gold/50 hover:text-gold'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {
                isCancelModalOpen && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-6 animate-fade-in">
                        <div className="bg-card-bg border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />

                            <h2 className="text-2xl font-serif font-bold mb-2 text-white">Cancel Appointment</h2>
                            <p className="text-subtle-text mb-6 text-sm">
                                Are you sure you want to cancel <span className="text-white font-bold">{selectedBookingForCancel?.userName || 'Guest'}</span>? This action cannot be undone.
                            </p>

                            <textarea
                                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl mb-6 focus:outline-none focus:border-red-500/50 transition-colors resize-none text-sm"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation..."
                                rows={3}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="flex-1 py-4 bg-white/5 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    className="flex-1 py-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                    disabled={!cancelReason || isCanceling}
                                >
                                    {isCanceling ? 'Processing...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Booking Detail Modal */}
            {
                isBookingDetailOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-6 animate-fade-in">
                        <div className="bg-card-bg border border-white/10 p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
                            <button
                                onClick={() => setIsBookingDetailOpen(false)}
                                className="absolute top-4 right-4 text-subtle-text hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-gold-gradient p-[1px]">
                                        <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center">
                                            <span className="text-gold font-bold text-xl">{(selectedBooking.userName || 'G').charAt(0)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-serif font-bold text-white">{selectedBooking.userName || 'Guest'}</h2>
                                        <p className="text-subtle-text text-sm">Booking Details</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle-text mb-2">Date & Time</h3>
                                    <p className="text-lg font-bold text-white">{selectedBooking.date}</p>
                                    <p className="text-2xl font-mono text-gold mt-1">{selectedBooking.timeSlot}</p>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle-text mb-2">Status</h3>
                                    <span className={`inline-block px-3 py-1 rounded-full border text-sm font-bold uppercase tracking-wider ${selectedBooking.status === 'confirmed' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                        selectedBooking.status === 'completed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                            'border-red-500/30 text-red-400 bg-red-500/10'
                                        }`}>
                                        {selectedBooking.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-xl border border-white/5 mb-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle-text mb-4 flex items-center gap-2">
                                    <Scissors size={14} className="text-gold" />
                                    Services Requested
                                </h3>
                                <div className="space-y-3">
                                    {selectedBooking.serviceIds.map(id => {
                                        const service = allServices.find(s => s.id === id);
                                        return service ? (
                                            <div key={id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-gold" />
                                                    <span className="text-white font-medium">{service.name}</span>
                                                </div>
                                                <span className="text-gold font-mono">${service.price}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase tracking-wider text-subtle-text">Total</span>
                                    <span className="text-2xl font-bold text-gold">${selectedBooking.totalPrice}</span>
                                </div>
                            </div>

                            {selectedBooking.status === 'confirmed' && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setIsBookingDetailOpen(false);
                                            handleCancelClick(selectedBooking);
                                        }}
                                        className="flex-1 py-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                                    >
                                        Cancel Booking
                                    </button>
                                    <button
                                        onClick={() => setIsBookingDetailOpen(false)}
                                        className="flex-1 py-4 bg-gold-gradient text-midnight rounded-xl font-bold text-xs uppercase tracking-wider hover:shadow-glow transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default BarberDashboardPage;