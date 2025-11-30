import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking, Service } from '../types';
import { Calendar, Clock, User, Scissors, X, Filter, Search, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const BarberAppointmentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: loggedInUser } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<string>('all');

    // Modal states
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCanceling, setIsCanceling] = useState(false);

    useEffect(() => {
        loadData();
    }, [loggedInUser]);

    const loadData = async () => {
        if (!loggedInUser || loggedInUser.role !== 'barber') return;
        setIsLoading(true);
        try {
            const [schedule, services] = await Promise.all([
                api.getBarberSchedule(),
                api.getServices(),
            ]);
            setBookings(schedule);
            setAllServices(services);
        } catch (error) {
            console.error("Failed to load appointments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBookings = useMemo(() => {
        let filtered = [...bookings];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status.toLowerCase() === statusFilter.toLowerCase());
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(b =>
                b.userName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(b => {
                const bookingDate = new Date(b.date);
                bookingDate.setHours(0, 0, 0, 0);

                if (dateFilter === 'today') {
                    return bookingDate.getTime() === today.getTime();
                } else if (dateFilter === 'upcoming') {
                    return bookingDate.getTime() >= today.getTime();
                } else if (dateFilter === 'past') {
                    return bookingDate.getTime() < today.getTime();
                }
                return true;
            });
        }

        // Sort by date and time
        return filtered.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });
    }, [bookings, statusFilter, searchQuery, dateFilter]);

    const handleCancelClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelReason('');
        setIsCancelModalOpen(true);
        setIsBookingDetailOpen(false);
    };

    const confirmCancel = async () => {
        if (!selectedBooking || !cancelReason) {
            alert("Please provide a reason for cancellation.");
            return;
        }

        setIsCanceling(true);
        try {
            await api.cancelBookingByBarber(selectedBooking.id, cancelReason);
            setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
            setIsCancelModalOpen(false);
            setSelectedBooking(null);
        } catch (error) {
            console.error("Failed to cancel booking:", error);
            alert("Error: Could not cancel booking.");
        } finally {
            setIsCanceling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-midnight">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full bg-midnight text-white p-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold text-gold mb-2">Appointments</h1>
                <p className="text-subtle-text text-sm">Manage your bookings and schedule</p>
            </div>

            {/* Filters */}
            <div className="bg-glass-card border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-md">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtle-text" />
                            <input
                                type="text"
                                placeholder="Search by customer name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors text-sm"
                            />
                        </div>
                    </div>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors text-sm cursor-pointer"
                    >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-gold/50 transition-colors text-sm cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                    </select>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-subtle-text">
                        Showing {filteredBookings.length} of {bookings.length} appointments
                    </span>
                    {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setDateFilter('all');
                            }}
                            className="text-gold hover:text-white transition-colors font-bold uppercase tracking-wider"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Bookings Grid */}
            {filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBookings.map((booking) => (
                        <div
                            key={booking.id}
                            onClick={() => {
                                setSelectedBooking(booking);
                                setIsBookingDetailOpen(true);
                            }}
                            className="bg-glass-card border border-white/10 p-6 rounded-2xl hover:border-gold/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gold-gradient p-[1px]">
                                    <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center">
                                        <span className="text-gold font-bold">{booking.userName.charAt(0)}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-serif font-bold">{booking.userName}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${booking.status === 'confirmed' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                                        booking.status === 'completed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                                            'border-red-500/30 text-red-400 bg-red-500/5'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-subtle-text">
                                    <Calendar size={14} />
                                    <span>{booking.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gold font-mono font-bold">
                                    <Clock size={14} />
                                    <span>{booking.timeSlot}</span>
                                </div>
                                <div className="flex items-center gap-2 text-subtle-text">
                                    <Scissors size={14} />
                                    <span className="truncate">{booking.serviceIds.map(id => allServices.find(s => s.id === id)?.name).join(', ')}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-xs text-subtle-text uppercase tracking-wider">Total</span>
                                <span className="text-lg font-bold text-gold">${booking.totalPrice}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-subtle-text">
                    <Calendar size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-bold">No appointments found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            )}

            {/* Booking Detail Modal */}
            {isBookingDetailOpen && selectedBooking && (
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
                                        <span className="text-gold font-bold text-xl">{selectedBooking.userName.charAt(0)}</span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-white">{selectedBooking.userName}</h2>
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
                                    onClick={() => handleCancelClick(selectedBooking)}
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
            )}

            {/* Cancel Modal */}
            {isCancelModalOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-6 animate-fade-in">
                    <div className="bg-card-bg border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />

                        <h2 className="text-2xl font-serif font-bold mb-2 text-white">Cancel Appointment</h2>
                        <p className="text-subtle-text mb-6 text-sm">
                            Are you sure you want to cancel <span className="text-white font-bold">{selectedBooking?.userName}</span>? This action cannot be undone.
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
            )}
        </div>
    );
};

export default BarberAppointmentsPage;
