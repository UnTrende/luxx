import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ServiceSelectionStep from '../components/ServiceSelectionStep';
import DateTimeSelectionStep from '../components/DateTimeSelectionStep';
import ConfirmationStep from '../components/ConfirmationStep';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const BookingPage: React.FC = () => {
  const { barberId: paramId } = useParams<{ barberId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Extract preselected service from location state (menu card entry)
  const preselectedServiceId = (location.state as any)?.preselectedServiceId;

  console.log('📍 NAVIGATION DEBUG: BookingPage component mounted', {
    paramId,
    locationState: location.state,
    preselectedServiceId,
    currentPath: location.pathname + location.hash
  });

  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  // Initialize step based on entry source: skip service screen if preselected
  const [step, setStep] = useState<number>(preselectedServiceId ? 2 : 1);
  const [checking, setChecking] = useState(true);   // prevents early redirect
  const didRun = useRef(false);                     // avoid StrictMode double-run

  // Auto-populate services if preselected (menu card entry)
  useEffect(() => {
    if (preselectedServiceId && !selectedServices.includes(preselectedServiceId)) {
      console.log('🎯 Auto-selecting preselected service:', preselectedServiceId);
      setSelectedServices([preselectedServiceId]);
    }
  }, [preselectedServiceId]);

  useEffect(() => {
    console.log('📍 BookingPage useEffect triggered', {
      paramId,
      locationState: location.state,
      preselectedServiceId
    });

    const fromState = location.state as any;
    const stateBarber = fromState?.barber;
    const stateBarberId = fromState?.barberId;

    const id = paramId || stateBarber?.id || stateBarberId;

    (async () => {
      try {
        if (stateBarber) {
          console.log('📍 BookingPage: Using barber from state', stateBarber);
          setSelectedBarber(stateBarber);
        } else if (id) {
          console.log('📍 BookingPage: Fetching barber by ID', id);
          const fetched = await api.getBarberById(id);
          console.log('📍 BookingPage: Fetched barber', fetched);
          setSelectedBarber(fetched);
        } else {
          // try a last fallback
          const saved = localStorage.getItem('selectedBarberId');
          console.log('📍 BookingPage: Trying localStorage fallback', saved);
          if (saved) {
            const fetched = await api.getBarberById(saved);
            setSelectedBarber(fetched);
          }
        }
      } catch (e) {
        console.error('📍 BookingPage: Failed to fetch barber:', e);
      } finally {
        setChecking(false);
      }
    })();
  }, [paramId, location.state]);

  // Account check before proceeding to time selection
  const checkAuthAndProceed = () => {
    if (!user) {
      console.log('🔒 User not logged in, redirecting to SIGNUP (forced) with state preservation');
      navigate('/login', {
        state: {
          from: location.pathname,
          returnTo: 'booking',
          barberId: selectedBarber?.id,
          preselectedServiceId,
          selectedServices,
          forceSignup: true  // Force signup mode, prevent switching to login
        }
      });
    } else {
      console.log('✅ User logged in, proceeding to time selection');
      handleNextStep();
    }
  };

  // Account check when starting at step 2 (preselected service flow)
  useEffect(() => {
    // Only run account check if:
    // 1. We're starting at step 2 (preselected service)
    // 2. Barber is loaded
    // 3. Not already checking
    if (step === 2 && selectedBarber && !checking && !user) {
      console.log('🔒 Step 2 loaded without user, triggering account check');
      checkAuthAndProceed();
    }
  }, [step, selectedBarber, checking, user]);

  // Don't redirect until we've tried to resolve the barber
  if (checking) {
    return (
      <div className="min-h-screen bg-dubai-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dubai-gold mx-auto mb-4"></div>
          <p className="text-subtle-text tracking-widest uppercase text-sm">Loading Experience...</p>
        </div>
      </div>
    );
  }

  if (!selectedBarber) {
    // safer fallback is the barbers listing, not dashboard
    console.warn('📍 BookingPage: No barber selected, redirecting to barbers page');
    return navigate('/barbers', { replace: true });
  }

  const handleNextStep = () => {
    console.log('➡️ Moving to step:', step + 1);
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    console.log('⬅️ Moving to step:', step - 1);
    setStep(step - 1);
  };

  const handleServiceSelection = (services: string[]) => {
    console.log('✅ Services selected:', services);
    setSelectedServices(services);
  };

  const handleDateTimeSelection = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    handleNextStep();
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service ? service.price : 0);
    }, 0);
  };

  const handleConfirmBooking = async () => {
    // ConfirmationStep component handles the actual booking creation
    // This function just handles the navigation after success
    navigate('/my-bookings');
  };

  console.log('🎯 Current booking state:', {
    step,
    barber: selectedBarber.name,
    services: selectedServices,
    date: selectedDate,
    time: selectedTime
  });

  return (
    <div className="min-h-screen bg-dubai-black text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 md:gap-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold transition-all duration-500 ${step >= stepNumber
                  ? 'bg-gradient-to-br from-dubai-gold to-[#F2D06B] text-dubai-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-dubai-dark-grey/30 text-subtle-text border border-white/10'
                  }`}>
                  {stepNumber}
                </div>
                <span className={`text-sm font-medium tracking-widest uppercase ${step >= stepNumber ? 'text-dubai-gold' : 'text-subtle-text'
                  }`}>
                  {stepNumber === 1 && 'Services'}
                  {stepNumber === 2 && 'Time'}
                  {stepNumber === 3 && 'Confirm'}
                </span>
                {stepNumber < 3 && (
                  <div className={`h-[1px] w-8 md:w-16 ${step > stepNumber ? 'bg-dubai-gold' : 'bg-white/10'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          {step === 1 && (
            <ServiceSelectionStep
              selectedServices={selectedServices}
              onServiceToggle={handleServiceSelection}
              onNext={checkAuthAndProceed}
              onBack={() => {
                console.log('📍 BookingPage: Navigating back to barbers');
                navigate('/barbers');
              }}
            />
          )}

          {step === 2 && (
            <DateTimeSelectionStep
              barber={selectedBarber}
              selectedServices={selectedServices}
              onNext={handleDateTimeSelection}
              onBack={handlePreviousStep}
            />
          )}

          {step === 3 && (
            <ConfirmationStep
              barber={selectedBarber}
              selectedServices={selectedServices}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              services={services}
              onBack={handlePreviousStep}
              onConfirm={handleConfirmBooking}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;