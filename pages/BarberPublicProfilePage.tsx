import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Barber } from '../types';
import { Star, Scissors, Loader } from 'lucide-react';
import { api } from '../services/api';
import { resolveBarberPhoto } from '../services/imageResolver';

const BarberPublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const b = await api.getBarberById(id);
        setBarber(b as any);
      } catch (e) {
        console.error('Failed to load barber profile', e);
        setBarber(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="text-center p-12"><Loader size={48} className="animate-spin mx-auto text-dubai-gold" /></div>;
  }
  if (!barber) {
    return <div className="text-center text-red-400 text-xl p-12">Artist not found.</div>;
  }

  const photoUrl = resolveBarberPhoto(barber);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="bg-charcoal-card rounded-3xl overflow-hidden shadow-lg border border-white/5">
        <div className="grid md:grid-cols-2">
          <div className="h-80 md:h-full">
            <img src={photoUrl} alt={barber.name} className="w-full h-full object-cover" onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1580905400738-25e359a8492c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
            }} />
          </div>
          <div className="p-8 space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">{barber.name}</h1>
            <div className="flex items-center gap-2 text-dubai-gold">
              <Star size={18} fill="currentColor" />
              <span className="font-semibold">{barber.rating?.toFixed?.(1) ?? barber.rating ?? '5.0'}</span>
            </div>
            <p className="text-subtle-text">{Array.isArray(barber.specialties) ? barber.specialties.join(' • ') : 'Master Barber'}</p>
            <div className="flex flex-wrap gap-2">
              {(barber.services || []).map((s: any) => (
                <span key={s.serviceId || s.id} className="px-3 py-1 text-xs border border-white/10 rounded-full text-subtle-text flex items-center gap-1">
                  <Scissors size={12} /> {s.name || s.serviceId}
                </span>
              ))}
            </div>
            <div className="pt-4 flex gap-3">
              <button onClick={() => navigate(`/book/${barber.id}`)} className="bg-dubai-gold text-dubai-black font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors">Book Now</button>
              <button onClick={() => navigate(`/book/${barber.id}`)} className="bg-white/10 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">View Menu</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberPublicProfilePage;