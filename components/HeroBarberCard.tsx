import React from 'react';
import { Star } from 'lucide-react';
import { Barber } from '../types';
import { resolveBarberPhoto } from '../services/imageResolver';

interface HeroBarberCardProps {
    barber: Barber;
    onClick: () => void;
}

const HeroBarberCard: React.FC<HeroBarberCardProps> = ({ barber, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group relative w-full h-[400px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02]"
        >
            {/* Background Image (Black & White by default) */}
            <div className="absolute inset-0 bg-dubai-black">
                <img
                    src={resolveBarberPhoto(barber)}
                    alt={barber.name}
                    className="w-full h-full object-cover opacity-80 grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
                    onError={(e) => {
                      // Fallback to default image if photo fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1580905400738-25e359a8492c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                    }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dubai-black via-transparent to-transparent opacity-90" />
            </div>

            {/* Border Glow (Hidden by default, shows on hover) */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-dubai-gold/50 rounded-2xl transition-colors duration-500" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-2xl text-white font-bold tracking-wide">
                        {barber.name.split("'")[0]} {/* Show first name only for cleaner look */}
                    </h3>
                    <div className="flex items-center gap-1 text-dubai-gold">
                        <Star size={16} fill="currentColor" />
                        <span className="font-sans font-medium">{barber.rating}</span>
                    </div>
                </div>

                <p className="text-subtle-text text-sm font-sans mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {barber.specialties.join(' • ')}
                </p>

                <div className="h-1 w-12 bg-dubai-gold rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
        </div>
    );
};

export default HeroBarberCard;
