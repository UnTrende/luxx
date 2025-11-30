import React, { useState, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Service } from '../types';

interface ServiceSelectionStepProps {
  selectedServices: string[];
  onServiceToggle: (serviceIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  selectedServices,
  onServiceToggle,
  onNext,
  onBack
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllServices();
  }, []);

  const loadAllServices = async () => {
    try {
      setLoading(true);
      const allServices = await api.getServices();
      console.log('📋 Loaded all services:', allServices);
      setServices(allServices);
    } catch (error) {
      console.error('Failed to load all services:', error);
      toast.error('Failed to load services. Please try again later.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    const newSelection = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];

    onServiceToggle(newSelection);
  };

  const totalPrice = selectedServices.reduce((total, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return total + (service?.price || 0);
  }, 0);

  if (loading) {
    return (
      <div className="bg-glass-card rounded-3xl p-8 border border-white/5 animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-glass-card rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl backdrop-blur-xl">
      <h3 className="text-3xl font-serif font-bold text-white mb-8 flex items-center gap-3">
        <span className="text-gold"><Scissors size={28} /></span>
        Select Services
      </h3>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-subtle-text">No services available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map(service => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <div
                key={service.id}
                className={`group relative p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${isSelected
                    ? 'border-gold bg-gold/10 shadow-glow'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Checkmark Circle */}
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-gold border-gold' : 'border-white/30 group-hover:border-white/50'
                      }`}>
                      {isSelected && <div className="w-2 h-2 bg-midnight rounded-full" />}
                    </div>

                    <div>
                      <h4 className={`font-serif font-bold text-lg transition-colors ${isSelected ? 'text-gold' : 'text-white'}`}>
                        {service.name}
                      </h4>
                      <p className="text-subtle-text text-sm">{service.duration} min • {service.category}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold text-xl transition-colors ${isSelected ? 'text-gold' : 'text-white'}`}>
                      ${service.price}
                    </p>
                  </div>
                </div>

                {/* Background Glow Effect */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gold-gradient opacity-5 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total Bar */}
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
        <div>
          <p className="text-subtle-text text-sm uppercase tracking-widest">Total Estimated</p>
          <p className="text-3xl font-serif font-bold text-gold">${totalPrice}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors font-medium uppercase tracking-wider text-xs"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={selectedServices.length === 0}
            className="px-8 py-3 rounded-full bg-gold-gradient text-midnight font-bold uppercase tracking-wider text-xs shadow-glow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-95"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelectionStep;