import React, { useState, useEffect } from 'react';
import { CheckCircle, User, Scissors, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import GoldConfetti from './GoldConfetti';
import { bookingSchema } from '../utils/validation';
import { logger } from '../src/lib/logger';

interface ConfirmationStepProps {
  barber: unknown;
  selectedServices: string[];
  selectedDate: string;
  selectedTime: string;
  services: unknown[];
  onBack: () => void;
  onConfirm: () => void;
  isRewardBooking?: boolean;
  pointsToRedeem?: number;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  barber,
  selectedServices,
  selectedDate,
  selectedTime,
  services,
  onBack,
  onConfirm,
  isRewardBooking = false,
  pointsToRedeem = 0
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<any[]>([]);

  useEffect(() => {
    // Load service details based on selected service IDs
    const loadServiceDetails = async () => {
      try {
        const allServices = await api.getServices();
        const selectedDetails = allServices.filter(service =>
          selectedServices.includes(service.id)
        );
        setServiceDetails(selectedDetails);
      } catch (error) {
        logger.error('Failed to load service details:', error, 'ConfirmationStep');
        setServiceDetails([]);
      }
    };

    if (selectedServices.length > 0) {
      loadServiceDetails();
    }
  }, [selectedServices]);

  const totalPrice = serviceDetails.reduce((total, service) =>
    total + (service?.price || 0), 0
  );

  const handleConfirmBooking = async () => {
    // Check authentication before proceeding
    if (!user) {
      navigate('/login', {
        state: {
          from: window.location.pathname,
          message: 'Please log in to complete your booking'
        }
      });
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      // Create the booking with actual user data
      const bookingDetails = {
        barberId: barber.id,
        serviceIds: selectedServices,
        date: selectedDate,
        timeSlot: selectedTime,
        totalPrice: isRewardBooking ? 0 : totalPrice, // Reward bookings are free
        userName: user.name || user.email || 'Customer',
        userId: user.id,
        isRewardBooking: isRewardBooking,
        pointsRedeemed: isRewardBooking ? pointsToRedeem : 0
      };

      logger.info('📋 ConfirmationStep: Booking details to send:', undefined, 'LegacyConsole');

      // Validate Booking Data
      const validation = bookingSchema.safeParse({
        barberId: bookingDetails.barberId,
        serviceIds: bookingDetails.serviceIds,
        date: bookingDetails.date,
        timeSlot: bookingDetails.timeSlot
      });

      if (!validation.success) {
        // Fix: Use issues instead of errors for Zod validation
        const firstIssue = validation.error.issues[0];
        throw new Error(firstIssue?.message || 'Invalid booking data');
      }
      await api.createBooking(bookingDetails);

      // Success state
      setShowSuccess(true);

      // Delay navigation to show confetti
      setTimeout(() => {
        onConfirm();
      }, 3000);

    } catch (error: Error | unknown) {
      logger.error('Booking failed:', error, 'ConfirmationStep');

      // Provide specific error messages
      let errorMessage = 'Failed to create booking. Please try again.';

      if (error.message?.includes('authentication') || error.message?.includes('auth')) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error.message?.includes('slot') || error.message?.includes('time')) {
        errorMessage = 'This time slot is no longer available. Please select another time.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      setBookingError(errorMessage);
      setIsBooking(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <GoldConfetti />
        <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gold/10 border-2 border-gold animate-bounce">
          <CheckCircle size={48} className="text-gold" />
        </div>
        <h3 className="text-3xl font-serif font-bold text-white mb-4 animate-fade-in">
          Booking Confirmed!
        </h3>
        <p className="text-subtle-text mb-8 animate-fade-in delay-100">
          Your appointment has been successfully scheduled.
        </p>
        <div className="animate-pulse text-gold text-sm uppercase tracking-widest">
          Redirecting to your bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-3xl font-serif font-bold text-white mb-8 text-center">
        Review Ticket
      </h3>

      {/* Ticket Container */}
      <div className="relative bg-white text-midnight rounded-t-3xl overflow-hidden shadow-2xl">
        {/* Gold Strip Top */}
        <div className="h-3 bg-gold-gradient w-full" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center border-b border-dashed border-midnight/20 pb-6 mb-6">
            <h4 className="font-serif font-bold text-2xl uppercase tracking-widest mb-1">LuxeCut</h4>
            <p className="text-xs text-midnight/60 uppercase tracking-widest">Premium Grooming</p>
          </div>

          {/* Barber Info */}
          <div className="flex items-center gap-4 mb-8">
            {barber.photo ? (
              <img
                src={barber.photo}
                alt={barber.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gold"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-midnight text-gold flex items-center justify-center border-2 border-gold">
                <User size={24} />
              </div>
            )}
            <div>
              <p className="text-xs text-midnight/60 uppercase tracking-widest">Artist</p>
              <p className="font-serif font-bold text-xl">{barber.name}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-midnight/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1 text-midnight/60">
                <Calendar size={14} />
                <span className="text-xs uppercase tracking-widest">Date</span>
              </div>
              <p className="font-bold text-lg">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="bg-midnight/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1 text-midnight/60">
                <Clock size={14} />
                <span className="text-xs uppercase tracking-widest">Time</span>
              </div>
              <p className="font-bold text-lg">{selectedTime}</p>
            </div>
          </div>

          {/* Services List */}
          <div className="mb-8">
            <p className="text-xs text-midnight/60 uppercase tracking-widest mb-3">Services</p>
            <div className="space-y-3">
              {serviceDetails.map(service => (
                <div key={service.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{service.name}</span>
                  <span className="font-bold">${service.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Price - Massive */}
          <div className="border-t-2 border-midnight pt-6 text-center">
            {isRewardBooking ? (
              <>
                <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold px-4 py-2 rounded-full mb-3">
                  <span className="text-2xl">🎁</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">Reward Booking</span>
                </div>
                <p className="text-xs text-midnight/60 mb-2">Redeeming {pointsToRedeem} Points</p>
                <p className="text-5xl font-serif font-bold text-gold">FREE</p>
                <p className="text-xs text-midnight/40 line-through mt-2">${totalPrice}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-midnight/60 uppercase tracking-widest mb-2">Total Amount</p>
                <p className="text-5xl font-serif font-bold text-midnight">${totalPrice}</p>
              </>
            )}
          </div>
        </div>

        {/* Zigzag Bottom */}
        <div className="relative h-6 bg-midnight -mt-[1px]">
          <svg className="absolute top-0 w-full h-full text-white fill-current" viewBox="0 0 1200 20" preserveAspectRatio="none">
            <path d="M0,0 L0,20 L1200,20 L1200,0 L1180,20 L1160,0 L1140,20 L1120,0 L1100,20 L1080,0 L1060,20 L1040,0 L1020,20 L1000,0 L980,20 L960,0 L940,20 L920,0 L900,20 L880,0 L860,20 L840,0 L820,20 L800,0 L780,20 L760,0 L740,20 L720,0 L700,20 L680,0 L660,20 L640,0 L620,20 L600,0 L580,20 L560,0 L540,20 L520,0 L500,20 L480,0 L460,20 L440,0 L420,20 L400,0 L380,20 L360,0 L340,20 L320,0 L300,20 L280,0 L260,20 L240,0 L220,20 L200,0 L180,20 L160,0 L140,20 L120,0 L100,20 L80,0 L60,20 L40,0 L20,20 L0,0 Z" />
          </svg>
        </div>
      </div>

      {bookingError && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-center backdrop-blur-sm">
          {bookingError}
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors font-medium uppercase tracking-wider text-xs"
        >
          Back
        </button>
        <button
          onClick={handleConfirmBooking}
          disabled={isBooking}
          className="px-10 py-4 rounded-full bg-gold-gradient text-midnight font-bold uppercase tracking-wider text-sm shadow-glow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-95 flex items-center gap-2"
        >
          {isBooking ? (
            <>
              <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : isRewardBooking ? (
            <>
              🎁 Confirm Reward
            </>
          ) : (
            'Confirm & Pay'
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;