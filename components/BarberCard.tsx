
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronsRight } from 'lucide-react';
import { Barber } from '../types';
import { resolveBarberPhoto } from '../services/imageResolver';

interface BarberCardProps {
  barber: Barber;
}

const BarberCard: React.FC<BarberCardProps> = ({ barber }) => {
  return (
    <div className="bg-charcoal-card rounded-xl overflow-hidden shadow-lg transition-transform transform hover:-translate-y-2 hover:shadow-lime-accent/10 flex flex-col">
      <img 
        src={resolveBarberPhoto(barber)} 
        alt={barber.name} 
        className="w-full h-64 object-cover" 
        onError={(e) => {
          // Fallback to default image if photo fails to load
          const target = e.target as HTMLImageElement;
          target.src = 'https://images.unsplash.com/photo-1580905400738-25e359a8492c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
        }}
      />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-light-text">{barber.name}</h3>
        <div className="flex items-center my-2 text-lime-accent">
          <Star size={20} className="fill-current" />
          <span className="ml-2 text-light-text font-semibold">{barber.rating} ({(barber.reviews || []).length} reviews)</span>
        </div>
        <p className="text-subtle-text mb-4">{(barber.specialties || []).join(', ')}</p>
        <div className="mt-auto">
          <Link to={`/barbers/${barber.id}`} className="bg-lime-accent text-dark-text font-bold py-3 px-6 rounded-lg hover:brightness-110 transition-all w-full flex items-center justify-center group">
            View Profile & Book <ChevronsRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BarberCard;