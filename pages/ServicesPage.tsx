import React, { useState, useEffect } from 'react';
import { Service } from '../types';
import { Scissors, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../src/lib/logger';

const ServicesPage: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedServices = await api.getServices();
                setServices(fetchedServices);
            } catch (err) {
                logger.error('❌ Error fetching services:', err, 'ServicesPage');
                setError('Failed to load services. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />
                    ))}
                </div>
            );
        }
        if (error) {
            return <p className="text-center text-xl text-red-400">{error}</p>;
        }
        if (services.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <div
                            key={service.id}
                            className="group relative bg-glass-card border border-white/5 p-8 rounded-3xl hover:border-gold/30 transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-pointer"
                            onClick={() => navigate('/barbers', {
                                state: { preselectedServiceId: service.id }
                            })}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                                <Scissors size={80} />
                            </div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium uppercase tracking-wider text-gold border border-gold/20">
                                            {service.category}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-gold transition-colors">{service.name}</h3>
                                    <div className="flex items-center gap-2 text-subtle-text text-sm mb-4">
                                        <Clock size={14} />
                                        <span>{service.duration} minutes</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-4">
                                    <span className="text-3xl font-serif font-bold text-gold">${service.price}</span>
                                    <button className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-midnight font-bold shadow-glow transform group-hover:scale-110 transition-transform duration-300">
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return <p className="text-center text-xl text-subtle-text">No services are currently available.</p>;
    };

    return (
        <div className="px-6 max-w-7xl mx-auto pt-8 pb-32 min-h-screen bg-midnight">
            <div className="text-center mb-12">
                <Scissors className="mx-auto text-gold h-10 w-10 mb-6 opacity-80" />
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Our Menu</h1>
                <div className="w-16 h-1 bg-gold mx-auto rounded-full mb-6" />
                <p className="text-lg text-subtle-text max-w-xl mx-auto font-light">
                    Experience the art of traditional barbering infused with modern luxury.
                </p>
            </div>
            {renderContent()}
        </div>
    );
};

export default ServicesPage;
