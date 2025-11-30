import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../services/api';

interface DateTimeSelectionStepProps {
  barber: any;
  selectedServices: string[];
  onNext: (date: string, time: string) => void;
  onBack: () => void;
}

const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({
  barber,
  selectedServices,
  onNext,
  onBack
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Generate dates for next 14 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Skip Sundays (0) and Mondays (1) if barber is off
      if (date.getDay() !== 0 && date.getDay() !== 1) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  const loadAvailableSlots = async (date: string) => {
    setLoading(true);
    try {
      // Call intelligent slot API with service IDs
      const slots = await api.getAvailableSlots(barber.id, date, selectedServices);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      toast.error('Failed to load available slots. Please try a different date.');
      // Fallback: try without service IDs
      try {
        const slots = await api.getAvailableSlots(barber.id, date);
        setAvailableSlots(slots);
      } catch (fallbackError) {
        console.error('Fallback slot loading also failed:', fallbackError);
        toast.error('Unable to load slots at this time. Please try again later.');
        setAvailableSlots([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    loadAvailableSlots(date);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedSlot) {
      onNext(selectedDate, selectedSlot);
    }
  };

  return (
    <div className="bg-glass-card rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl backdrop-blur-xl">
      <h3 className="text-3xl font-serif font-bold text-white mb-8 flex items-center gap-3">
        <span className="text-gold"><Calendar size={28} /></span>
        Select Date & Time
      </h3>

      <div className="space-y-10">
        {/* Date Selection - Horizontal Scroll */}
        <div>
          <h4 className="text-subtle-text text-sm uppercase tracking-widest mb-4">Select Date</h4>
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide -mx-2 px-2">
            {generateDates().map(date => {
              const isSelected = selectedDate === date;
              const dateObj = new Date(date);
              return (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-all duration-300 ${isSelected
                      ? 'bg-white text-midnight border-white scale-110 shadow-glow'
                      : 'bg-white/5 text-subtle-text border-white/10 hover:bg-white/10 hover:border-white/30'
                    }`}
                >
                  <span className={`text-xs uppercase font-medium mb-1 ${isSelected ? 'text-midnight/70' : ''}`}>
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-2xl font-bold ${isSelected ? 'text-midnight' : 'text-white'}`}>
                    {dateObj.getDate()}
                  </span>
                  <span className={`text-[10px] uppercase ${isSelected ? 'text-midnight/70' : ''}`}>
                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Selection - Grid of Pills */}
        <div>
          <h4 className="text-subtle-text text-sm uppercase tracking-widest mb-4">Available Times</h4>
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-full" />
              ))}
            </div>
          ) : selectedDate ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto pr-2">
              {availableSlots.length === 0 ? (
                <p className="text-subtle-text col-span-full text-center py-8 italic">
                  No available slots for this date. Please try another day.
                </p>
              ) : (
                availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-full border text-sm font-medium transition-all duration-300 ${isSelected
                          ? 'bg-gold border-gold text-midnight shadow-glow transform scale-105'
                          : 'bg-transparent border-white/20 text-white hover:border-gold hover:text-gold'
                        }`}
                    >
                      {slot}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <Clock className="mx-auto text-subtle-text mb-2 opacity-50" size={32} />
              <p className="text-subtle-text">Please select a date above to view times</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center pt-6 border-t border-white/10">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors font-medium uppercase tracking-wider text-xs"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedSlot}
          className="px-8 py-3 rounded-full bg-gold-gradient text-midnight font-bold uppercase tracking-wider text-xs shadow-glow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-95"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default DateTimeSelectionStep;