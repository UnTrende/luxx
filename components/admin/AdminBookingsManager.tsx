import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Booking, Service, Barber } from '../../types';
import { api } from '../../services/api';
import { Search, Filter, Calendar, Clock, User, Scissors, X, AlertCircle } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminBookingsManagerProps {
    bookings: Booking[];
    setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
    services: Service[];
    barbers: Barber[];
    initialFilter?: string | null;
}

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({ bookings, setBookings, services, barbers, initialFilter }) => {
    const [bookingSearchTerm, setBookingSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialFilter || 'all');
    const [showContextBanner, setShowContextBanner] = useState(!!initialFilter);

    // Count items for context banner
    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    const handleBookingStatusUpdate = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
        try {
            logger.info('Client updating booking status', {
      bookingId,
      newStatus,
      bookingIdType: typeof bookingId,
      bookingExists: !!bookingId
    }, 'AdminBookingsManager');

            // Optimistic update
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));

            // Persist to database
            const result = await api.updateBookingStatus(bookingId, newStatus);
            
            // Show success message with loyalty info if available
            if (newStatus === 'completed' && result.loyaltyResult) {
                const loyalty = result.loyaltyResult;
                
                // Check if this was a reward booking (points deducted)
                if (loyalty.isRewardBooking) {
                    toast.success(
                        `💎 Reward booking completed! ${loyalty.pointsRedeemed} points deducted. Customer balance: ${loyalty.newBalance} points`,
                        { duration: 5000 }
                    );
                } else if (loyalty.tierUpgraded) {
                    toast.success(
                        `🎉 Booking completed! Customer upgraded to ${loyalty.newTier} tier and earned ${loyalty.pointsAwarded} points!`,
                        { duration: 6000 }
                    );
                } else {
                    toast.success(
                        `✅ Booking completed! Customer earned ${loyalty.pointsAwarded} loyalty points (${loyalty.newVisitCount} total visits)`,
                        { duration: 5000 }
                    );
                }
            } else {
                toast.success('Booking status updated successfully');
            }
        } catch (error) {
            logger.error('Booking status update failed:', error, 'AdminBookingsManager');
            toast.error('Failed to update booking status');

            // Revert on error
            const bookings = await api.getAllBookings();
            setBookings(bookings || []);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = (booking.userName?.toLowerCase() || '').includes(bookingSearchTerm.toLowerCase()) ||
            (booking.barberId?.toLowerCase() || '').includes(bookingSearchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Context Banner - Shows why user is here */}
            {showContextBanner && initialFilter === 'pending' && pendingCount > 0 && (
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-5 rounded-xl relative animate-slide-down">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                                <AlertCircle className="text-yellow-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">⚠️ Action Required</h3>
                                <p className="text-yellow-200 text-sm">
                                    You have <span className="font-bold">{pendingCount} pending booking{pendingCount !== 1 ? 's' : ''}</span> that need confirmation.
                                    {pendingCount > 5 && ' This is higher than usual!'}
                                </p>
                                <p className="text-yellow-200/70 text-xs mt-1">
                                    Review and confirm or cancel these bookings to keep customers informed.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowContextBanner(false)}
                            className="text-yellow-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
                            <Calendar size={24} />
                        </span>
                        Reservations
                    </h2>
                    <p className="text-subtle-text text-sm">Manage appointments and schedules</p>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
                    <div className="relative flex-1 md:min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                            value={bookingSearchTerm}
                            onChange={(e) => setBookingSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-black/40 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white focus:outline-none focus:border-gold/50 transition-all cursor-pointer hover:bg-white/5"
                        >
                            <option value="all" className="bg-gray-900">All Statuses</option>
                            <option value="pending" className="bg-gray-900">Pending</option>
                            <option value="confirmed" className="bg-gray-900">Confirmed</option>
                            <option value="completed" className="bg-gray-900">Completed</option>
                            <option value="cancelled" className="bg-gray-900">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-glass-card rounded-3xl border border-white/10 overflow-hidden shadow-glass">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Customer</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Service</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Barber</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Date & Time</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Status</th>
                                <th className="text-right py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredBookings.map((booking) => {
                                // Get service names from service_ids
                                const serviceNames = booking.serviceIds
                                    ? booking.serviceIds
                                        .map((id: string) => services.find(s => s.id === id)?.name)
                                        .filter(Boolean)
                                        .join(', ')
                                    : 'Unknown Service';

                                // Get barber name from barber_id
                                const barberName = booking.barberId
                                    ? barbers.find(b => b.id === booking.barberId)?.name || 'Any Barber'
                                    : 'Any Barber';

                                // Check if this is a reward booking
                                const isRewardBooking = (booking as any).is_reward_booking || false;
                                const pointsRedeemed = (booking as any).points_redeemed || 0;

                                return (
                                    <tr key={booking.id} className="hover:bg-white/5 transition-all duration-300 group">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 text-xs font-bold">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white group-hover:text-gold transition-colors">{booking.userName || 'Unknown'}</span>
                                                        {isRewardBooking && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                                                🎁 Reward
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isRewardBooking && (
                                                        <span className="text-xs text-cyan-400/70">
                                                            {pointsRedeemed} points redeemed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-2 text-subtle-text text-sm">
                                                <Scissors size={14} className="text-gold/50" />
                                                {serviceNames}
                                            </div>
                                        </td>
                                        <td className="py-5 px-8 text-subtle-text text-sm">{barberName}</td>
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-2 text-white font-mono text-sm">
                                                <Clock size={14} className="text-gold" />
                                                {booking.date} <span className="text-white/30">|</span> {booking.timeSlot}
                                            </div>
                                        </td>
                                        <td className="py-5 px-8">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${booking.status.toLowerCase() === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    booking.status.toLowerCase() === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        booking.status.toLowerCase() === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${booking.status.toLowerCase() === 'confirmed' ? 'bg-green-400 animate-pulse' :
                                                        booking.status.toLowerCase() === 'pending' ? 'bg-yellow-400' :
                                                            booking.status.toLowerCase() === 'cancelled' ? 'bg-red-400' :
                                                                'bg-blue-400'
                                                    }`} />
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <div className="inline-flex bg-black/40 rounded-lg border border-white/10 p-1">
                                                <select
                                                    value={booking.status.toLowerCase()}
                                                    onChange={(e) => handleBookingStatusUpdate(booking.id, e.target.value as any)}
                                                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-2 py-1"
                                                >
                                                    <option value="pending" className="bg-gray-900">Pending</option>
                                                    <option value="confirmed" className="bg-gray-900">Confirmed</option>
                                                    <option value="completed" className="bg-gray-900">Completed</option>
                                                    <option value="cancelled" className="bg-gray-900">Cancelled</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredBookings.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-subtle-text">
                                <Calendar size={24} />
                            </div>
                            <p className="text-subtle-text text-sm">No bookings found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
