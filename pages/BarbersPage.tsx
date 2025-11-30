
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeroBarberCard from '../components/HeroBarberCard';
import { Barber } from '../types';
import { api } from '../services/api'; // Import our new API service

const BarbersPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [availableBarbers, setAvailableBarbers] = useState<Barber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extract preselected service from location state (from ServicesPage)
    const preselectedServiceId = (location.state as any)?.preselectedServiceId;

    useEffect(() => {
        const fetchBarbers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const barbers = await api.getBarbers();
                setAvailableBarbers(barbers);
            } catch (err) {
                setError('Failed to load barbers. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBarbers();

        // Refetch when page becomes visible (e.g., returning from profile page)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('🔄 Page visible - refreshing barber data');
                fetchBarbers();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also refetch on navigation (when component remounts)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dubai-gold"></div>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-20">
                    <p className="text-xl text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-dubai-gold hover:underline"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        if (availableBarbers.length > 0) {
            return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availableBarbers.map((barber) => (
                        <HeroBarberCard
                            key={barber.id}
                            barber={barber}
                            onClick={() => {
                                console.log('📍 Barber selected:', barber.name, barber.id);
                                console.log('📍 Preselected service:', preselectedServiceId);
                                navigate(`/book/${barber.id}`, {
                                    state: {
                                        barber,
                                        preselectedServiceId
                                    }
                                });
                            }}
                        />
                    ))}
                </div>
            );
        }
        return (
            <div className="text-center py-20">
                <p className="text-xl text-subtle-text">No artists are currently available.</p>
            </div>
        );
    }

    return (
        <div className="px-6 max-w-7xl mx-auto pt-8 pb-20">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Our Artists</h1>
                <div className="w-24 h-1 bg-dubai-gold mx-auto rounded-full" />
                <p className="mt-6 text-subtle-text max-w-2xl mx-auto">
                    Select a master barber to begin your journey.
                </p>
            </div>
            {renderContent()}
        </div>
    );
};

export default BarbersPage;
