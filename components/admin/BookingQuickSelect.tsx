import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, User, DollarSign } from 'lucide-react';
import { api } from '../../services/api';
import { logger } from '../../src/lib/logger';

interface BookingForBilling {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    barber_id: string;
    barber_name: string;
    date: string;
    timeSlot: string;
    totalPrice: number;
    status: string;
    services: unknown[];
    serviceIds: string[];
}

interface BookingQuickSelectProps {
    onSelect: (booking: BookingForBilling) => void;
    onClose: () => void;
}

export function BookingQuickSelect({ onSelect, onClose }: BookingQuickSelectProps) {
    const [bookings, setBookings] = useState<BookingForBilling[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingForBilling[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch bookings for billing
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsData = await api.getBookingsForBilling();
                setBookings(bookingsData);
                setFilteredBookings(bookingsData);
            } catch (error) {
                logger.error('Error fetching bookings:', error, 'BookingQuickSelect');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookings();
    }, []);

    // Filter bookings based on search
    useEffect(() => {
        if (!searchTerm) {
            setFilteredBookings(bookings);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = bookings.filter(
            booking =>
                booking.customer_name.toLowerCase().includes(term) ||
                booking.customer_phone.includes(term)
        );
        setFilteredBookings(filtered);
    }, [searchTerm, bookings]);

    // Group bookings by date
    const groupedBookings = filteredBookings.reduce((groups, booking) => {
        const date = booking.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(booking);
        return groups;
    }, {} as Record<string, BookingForBilling[]>);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-glass border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-glow">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold-gradient rounded-lg">
                            <Calendar className="text-midnight" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Select Booking</h2>
                            <p className="text-subtle-text text-sm">Choose a booking to complete billing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by customer name or phone..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                </div>

                {/* Bookings List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar size={48} className="mx-auto mb-4 text-subtle-text opacity-30" />
                            <p className="text-subtle-text">No unpaid bookings found</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedBookings)
                                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                                .map(([date, dateBookings]) => (
                                    <div key={date}>
                                        <div className="text-gold font-bold mb-3 flex items-center gap-2">
                                            <Calendar size={16} />
                                            {new Date(date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>

                                        <div className="space-y-2">
                                            {dateBookings.map((booking) => (
                                                <button
                                                    key={booking.id}
                                                    onClick={() => onSelect(booking)}
                                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-gold/50 transition-all text-left group"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="text-white font-bold group-hover:text-gold transition-colors">
                                                                {booking.customer_name}
                                                            </div>
                                                            <div className="text-subtle-text text-sm">{booking.customer_phone}</div>
                                                        </div>
                                                        <div className="text-gold font-mono font-bold">
                                                            ${booking.totalPrice.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-subtle-text">
                                                        <span className="flex items-center gap-1">
                                                            <User size={14} />
                                                            {booking.barber_name}
                                                        </span>
                                                        <span>{booking.timeSlot}</span>
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign size={14} />
                                                            {booking.services.length} service(s)
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
