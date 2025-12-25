import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookingWithDetails } from '../types';
import { Star, X, Send, Trash2, CalendarX2, User, Loader, Scissors, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { logger } from '../src/lib/logger';

const MyBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: loggedInUser, isLoading: isAuthLoading } = useAuth();

    const [myBookings, setMyBookings] = useState<BookingWithDetails[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [bookingToReview, setBookingToReview] = useState<BookingWithDetails | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !loggedInUser) {
            navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
        }
    }, [loggedInUser, isAuthLoading, navigate, location]);

    useEffect(() => {
        if (loggedInUser) {
            const fetchBookings = async () => {
                try {
                    setIsLoadingBookings(true);
                    setError(null);
                    const bookings = await api.getMyBookings();
                    setMyBookings(bookings);
                } catch (err) {
                    logger.error('Error fetching bookings', err, 'MyBookingsPage');
                    setError('Failed to load your bookings. Please try again.');
                } finally {
                    setIsLoadingBookings(false);
                }
            };
            fetchBookings();
        }
    }, [loggedInUser?.id]); // Use stable ID instead of object reference

    const { upcomingBookings, pastBookings } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = myBookings
            .filter(b => new Date(b.date) >= now && b.status === 'confirmed')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const past = myBookings
            .filter(b => new Date(b.date) < now || b.status !== 'confirmed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { upcomingBookings: upcoming, pastBookings: past };
    }, [myBookings]);

    const openReviewModal = (booking: BookingWithDetails) => {
        setBookingToReview(booking);
        setRating(0);
        setComment('');
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingToReview || rating === 0 || !loggedInUser) {
            toast.error("Please provide a star rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.submitReview({
                bookingId: bookingToReview.id,
                rating,
                comment,
                barberId: bookingToReview.barbers!.id,
            });
            setMyBookings(prev => prev.map(b =>
                b.id === bookingToReview.id ? { ...b, reviewLeft: true } : b
            ));
            setIsReviewModalOpen(false);
        } catch (err) {
            toast.error('Failed to submit review. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (window.confirm("Are you sure you want to cancel this booking?")) {
            try {
                await api.cancelBooking(bookingId);
                setMyBookings(prev => prev.map(b =>
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                ));
            } catch (error) {
                toast.error('Failed to cancel booking. Please try again.');
                console.error(error);
            }
        }
    };

    const getStatusChip = (status: BookingWithDetails['status']) => {
        switch (status) {
            case 'Completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Confirmed': return 'bg-gold/10 text-gold border-gold/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-subtle-text border-white/10';
        }
    };

    const BookingCard: React.FC<{ booking: BookingWithDetails }> = ({ booking }) => (
        <div className="group relative bg-glass-card border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-gold/30 hover:shadow-glow hover:-translate-y-1">
            {/* Left Accent Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-500 ${booking.status === 'confirmed' ? 'bg-gold' :
                booking.status === 'completed' ? 'bg-green-500' : 'bg-white/10'
                }`} />

            <div className="p-6 pl-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Date & Time Column */}
                    <div className="flex flex-col justify-center min-w-[100px] border-r border-white/5 pr-6 md:block hidden">
                        <span className="text-3xl font-serif font-bold text-white leading-none">
                            {new Date(booking.date).getDate()}
                        </span>
                        <span className="text-sm text-gold uppercase tracking-widest font-medium mb-2 block">
                            {new Date(booking.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xs text-subtle-text flex items-center gap-1">
                            <Clock size={12} />
                            {booking.timeSlot}
                        </span>
                    </div>

                    {/* Mobile Date Header */}
                    <div className="flex justify-between items-center md:hidden border-b border-white/5 pb-4 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/5 p-2 rounded-lg">
                                <Calendar size={18} className="text-gold" />
                            </div>
                            <div>
                                <p className="text-white font-bold">
                                    {new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-xs text-subtle-text">{booking.timeSlot}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest font-bold ${getStatusChip(booking.status)}`}>
                            {booking.status}
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold transition-colors">
                                    {booking.barbers?.name || 'Unknown Barber'}
                                </h3>
                                <p className="text-xs text-subtle-text uppercase tracking-widest mb-4">Master Barber</p>
                            </div>
                            <div className={`hidden md:block px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest font-bold ${getStatusChip(booking.status)}`}>
                                {booking.status}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-subtle-text mb-4">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gold/50" />
                                <span>LuxeCut Dubai Mall</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <div className="flex items-center gap-2">
                                <Scissors size={14} className="text-gold/50" />
                                <span>Premium Cut</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            {booking.status === 'completed' && !booking.reviewLeft && (
                                <button
                                    onClick={() => openReviewModal(booking)}
                                    className="text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Star size={14} />
                                    Rate Experience
                                </button>
                            )}
                            {booking.status === 'completed' && booking.reviewLeft && (
                                <span className="text-xs font-bold uppercase tracking-widest text-gold/50 flex items-center gap-2 cursor-default">
                                    <Star size={14} className="fill-gold/50" />
                                    Rated
                                </span>
                            )}
                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Cancel
                                </button>
                            )}

                            <div className="flex-1" />
                            <p className="text-xl font-serif font-bold text-white">
                                ${booking.totalPrice?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isAuthLoading || !loggedInUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-midnight">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-midnight pt-8 pb-32 px-6">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Concierge</h1>
                        <p className="text-subtle-text text-xs uppercase tracking-widest">Manage your appointments</p>
                    </div>
                    <button
                        onClick={() => navigate('/barbers')}
                        className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-midnight transition-all"
                    >
                        <Scissors size={18} />
                    </button>
                </div>

                {/* Custom Segmented Control */}
                <div className="bg-white/5 p-1 rounded-xl flex relative">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-all duration-300 ease-out ${activeTab === 'past' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                            }`}
                    />
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest text-center relative z-10 transition-colors ${activeTab === 'upcoming' ? 'text-white' : 'text-subtle-text hover:text-white/70'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest text-center relative z-10 transition-colors ${activeTab === 'past' ? 'text-white' : 'text-subtle-text hover:text-white/70'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Content Area */}
                <div className="space-y-4 min-h-[400px]">
                    {isLoadingBookings ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-subtle-text uppercase tracking-widest">Retrieving Records...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : (activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <CalendarX2 size={24} className="text-subtle-text" />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-white mb-2">
                                {activeTab === 'upcoming' ? 'No Upcoming Visits' : 'No History Found'}
                            </h3>
                            <p className="text-subtle-text text-sm max-w-xs mx-auto mb-6">
                                {activeTab === 'upcoming'
                                    ? "Your schedule is clear. Ready for your next transformation?"
                                    : "You haven't completed any appointments yet."}
                            </p>
                            {activeTab === 'upcoming' && (
                                <button
                                    onClick={() => navigate('/barbers')}
                                    className="px-6 py-3 bg-gold-gradient text-midnight font-bold rounded-full text-xs uppercase tracking-widest hover:shadow-glow transition-all"
                                >
                                    Book Appointment
                                </button>
                            )}
                        </div>
                    ) : (
                        (activeTab === 'upcoming' ? upcomingBookings : pastBookings).map(booking => (
                            <BookingCard key={booking.id} booking={booking} />
                        ))
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && bookingToReview && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
                    <div className="bg-card-bg border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[50px] rounded-full pointer-events-none" />

                        <button
                            onClick={() => setIsReviewModalOpen(false)}
                            className="absolute top-4 right-4 text-subtle-text hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-serif font-bold text-white mb-1">Rate Experience</h2>
                        <p className="text-xs text-subtle-text uppercase tracking-widest mb-8">
                            with {bookingToReview.barbers?.name}
                        </p>

                        <form onSubmit={handleReviewSubmit} className="space-y-6">
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="p-2 transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={`transition-colors ${rating >= star ? 'text-gold fill-gold' : 'text-white/10'}`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                placeholder="Share your thoughts..."
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-subtle-text focus:outline-none focus:border-gold/50 transition-colors text-sm resize-none"
                            />

                            <button
                                type="submit"
                                disabled={rating === 0 || isSubmitting}
                                className="w-full py-4 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader className="animate-spin" size={16} />
                                ) : (
                                    <>
                                        <span>Submit Review</span>
                                        <Send size={14} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;