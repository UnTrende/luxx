import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Booking, Service, Barber } from '../../types';
import { api } from '../../services/api';

interface AdminBookingsManagerProps {
    bookings: Booking[];
    setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
    services: Service[];
    barbers: Barber[];
}

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({ bookings, setBookings, services, barbers }) => {
    const [bookingSearchTerm, setBookingSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const handleBookingStatusUpdate = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
        try {
            // Optimistic update
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));

            // Persist to database
            await api.updateBookingStatus(bookingId, newStatus);
            toast.success('Booking status updated successfully');
        } catch (error) {
            console.error('Booking status update failed:', error);
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-dubai-black">Reservations</h2>
                        <p className="text-subtle-text text-sm mt-1">Manage appointments and schedules</p>
                    </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dubai-gold/50"
                            value={bookingSearchTerm}
                            onChange={(e) => setBookingSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-dark-grey focus:border-dubai-black focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setBookingSearchTerm('');
                            setStatusFilter('all');
                        }}
                        className="px-4 py-3 text-subtle-text hover:text-dubai-black font-bold transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Customer</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Service</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Barber</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Date & Time</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Status</th>
                            <th className="text-right py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
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

                            return (
                                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-8 font-medium text-dubai-dark-grey">
                                        {booking.userName || 'Unknown'}
                                    </td>
                                    <td className="py-4 px-8 text-subtle-text">{serviceNames}</td>
                                    <td className="py-4 px-8 text-subtle-text">{barberName}</td>
                                    <td className="py-4 px-8 font-mono text-sm text-subtle-text">
                                        {booking.date} {booking.timeSlot}
                                    </td>
                                    <td className="py-4 px-8">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' || booking.status === 'Confirmed' ? 'bg-green-100 text-green-600' :
                                            booking.status === 'Pending' || booking.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                                booking.status === 'Canceled' || booking.status === 'Cancelled' || booking.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-8 text-right">
                                        <select
                                            value={booking.status.toLowerCase()}
                                            onChange={(e) => handleBookingStatusUpdate(booking.id, e.target.value as any)}
                                            className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-dubai-dark-grey focus:border-dubai-black focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredBookings.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-subtle-text text-lg">No bookings found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
