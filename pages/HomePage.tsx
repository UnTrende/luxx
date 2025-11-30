import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import HeroBarberCard from '../components/HeroBarberCard';
import GoldBookingButton from '../components/GoldBookingButton';
import { ChevronsRight, ShoppingBag, Scissors } from 'lucide-react';
import { Barber, Service } from '../types';
import { resolveBarberPhoto } from '../services/imageResolver';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [featuredBarbers, setFeaturedBarbers] = useState<Barber[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchFeaturedBarbers = async () => {
      try {
        const allBarbers = await api.getBarbers();
        setFeaturedBarbers(allBarbers.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch barbers for homepage:", error);
      }
    };

    const updateHeroImages = () => {
      if (!isSettingsLoading && settings) {
        const heroUrls = [];
        if (settings.hero_images && Array.isArray(settings.hero_images)) {
          for (const imagePath of settings.hero_images) {
            if (imagePath) {
              heroUrls.push(`/storage/v1/object/public/product-images/${imagePath}`);
            }
          }
        }
        setHeroImages(heroUrls);
      } else {
        const imagesString = localStorage.getItem('heroImages');
        const images = imagesString ? JSON.parse(imagesString) : [];
        setHeroImages(images);
      }
    };

    fetchFeaturedBarbers();
    updateHeroImages();

    // Fetch services for homepage
    (async () => {
      try {
        const allServices = await api.getServices();
        setServices(allServices);
      } catch (error) {
        console.error('Failed to fetch services for homepage:', error);
        setServices([]);
      }
    })();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'appBarbers') {
        fetchFeaturedBarbers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [settings, isSettingsLoading]);

  useEffect(() => {
    if (paused || heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [paused, heroImages]);

  const handleBookNow = () => {
    if (user) {
      navigate('/barbers');
    } else {
      navigate('/login', { state: { from: '/barbers' } });
    }
  };

  return (
    <div className="pb-32 bg-midnight min-h-screen">
      {/* Hero Section - Full Height & Dark */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center text-white overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background Overlay - Black to Transparent Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/90 via-midnight/50 to-midnight z-10" />

        {/* Background Images */}
        {heroImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Hero image ${i + 1}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-all duration-[2000ms] ease-in-out transform scale-105 ${i === currentIndex ? "opacity-100 scale-100" : "opacity-0"}`}
          />
        ))}

        {/* Content */}
        <div className="relative z-20 p-6 max-w-5xl mx-auto flex flex-col items-center">
          <div className="mb-8 animate-fade-in">
            <span className="text-gold uppercase tracking-[0.4em] text-xs md:text-sm font-medium border-b border-gold/50 pb-3">
              Dubai's Premier Grooming Destination
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white mb-10 leading-tight animate-slide-up">
            Precision <span className="text-gold-gradient italic">&</span> Style
          </h1>

          <p className="text-lg md:text-2xl text-light-text/80 max-w-3xl mx-auto mb-16 font-light leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Experience the art of traditional barbering infused with modern luxury.
            Where every cut is a masterpiece.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {/* Ghost Button */}
            <button
              onClick={handleBookNow}
              className="group relative px-10 py-4 overflow-hidden rounded-full border border-gold text-gold transition-all duration-300 hover:text-midnight min-w-[220px]"
            >
              <div className="absolute inset-0 w-full h-full bg-gold-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 font-serif font-bold uppercase tracking-widest text-sm">Book Appointment</span>
            </button>

            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 text-white/70 hover:text-white transition-colors duration-300 uppercase tracking-widest text-sm font-medium border-b border-transparent hover:border-white/30"
            >
              View Collection
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce text-white/30">
          <ChevronsRight className="rotate-90" size={24} />
        </div>
      </section>

      {/* Featured Barbers Section - Story Circles */}
      <section className="px-6 max-w-7xl mx-auto mb-32 relative z-20 -mt-20">
        <div className="bg-glass-card rounded-3xl p-8 md:p-12 border border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Master Barbers</h2>
              <p className="text-subtle-text text-sm uppercase tracking-wider">Select your artist</p>
            </div>
            <Link to="/barbers" className="group flex items-center gap-2 text-gold hover:text-white transition-colors text-sm font-medium uppercase tracking-widest">
              <span>View All</span>
              <ChevronsRight className="transform group-hover:translate-x-1 transition-transform" size={16} />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            {featuredBarbers.map((barber, index) => (
              <div
                key={barber.id}
                className="group flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/barbers/${barber.id}`)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4">
                  <div className="absolute inset-0 rounded-full bg-gold-gradient p-[2px] opacity-70 group-hover:opacity-100 group-hover:shadow-glow transition-all duration-500">
                    <div className="w-full h-full rounded-full bg-midnight p-[2px]">
                      <img
                        src={resolveBarberPhoto(barber)}
                        alt={barber.name}
                        className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        onError={(e) => {
                          // Fallback to default image if avatar_url fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1580905400738-25e359a8492c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                    </div>
                  </div>
                  {/* Online Status Dot */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-midnight rounded-full" />
                </div>
                <h3 className="text-white font-serif text-lg tracking-wide group-hover:text-gold transition-colors">{barber.name}</h3>
                <span className="text-xs text-subtle-text uppercase tracking-widest mt-1">{barber.specialties?.[0] || 'Master Barber'}</span>
              </div>
            ))}

            {/* "More" Circle */}
            <div
              className="group flex flex-col items-center cursor-pointer"
              onClick={() => navigate('/barbers')}
            >
              <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 flex items-center justify-center rounded-full border border-white/10 bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                <ChevronsRight className="text-white/50 group-hover:text-gold transition-colors" size={32} />
              </div>
              <span className="text-xs text-subtle-text uppercase tracking-widest">View All</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Bento Grid */}
      <section className="px-6 max-w-7xl mx-auto mb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">Signature Services</h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
          {services.slice(0, 5).map((service, i) => (
            <div
              key={service.id}
              className={`group relative bg-glass-card border border-white/5 p-8 rounded-3xl hover:border-gold/30 transition-all duration-500 hover:-translate-y-1 overflow-hidden ${i === 0 || i === 3 ? 'md:col-span-2' : ''}`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                <Scissors size={i === 0 || i === 3 ? 120 : 80} />
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium uppercase tracking-wider text-gold border border-gold/20">
                      {service.category}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 group-hover:text-gold transition-colors">{service.name}</h3>
                  <p className="text-subtle-text text-sm max-w-[80%]">{service.duration} minutes of pure relaxation</p>
                </div>

                <div className="flex justify-end">
                  <span className="text-2xl md:text-3xl font-serif font-bold text-gold">${service.price}</span>
                </div>
              </div>
            </div>
          ))}

          {/* View All Services Card */}
          <div
            className="group relative bg-gold-gradient p-8 rounded-3xl flex flex-col justify-center items-center text-center cursor-pointer hover:shadow-glow transition-all duration-500"
            onClick={() => navigate('/services')}
          >
            <h3 className="text-2xl font-serif font-bold text-midnight mb-2">View Full Menu</h3>
            <p className="text-midnight/70 text-sm mb-6">Discover all our premium treatments</p>
            <div className="w-12 h-12 rounded-full bg-midnight/10 flex items-center justify-center group-hover:bg-midnight group-hover:text-gold transition-all duration-300">
              <ChevronsRight size={24} className="text-midnight group-hover:text-gold" />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-6 max-w-7xl mx-auto text-center">
        <div className="bg-gradient-to-r from-card-bg via-[#1a1a1a] to-card-bg border border-white/5 rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <ShoppingBag size={48} className="mx-auto text-gold mb-8 opacity-80" />

            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Premium Essentials</h2>
            <p className="text-xl text-subtle-text max-w-2xl mx-auto mb-12 font-light">
              Elevate your daily ritual with our curated collection of grooming products.
            </p>

            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-3 px-10 py-4 bg-white text-midnight font-bold uppercase tracking-widest rounded-full hover:bg-gold transition-colors duration-300 shadow-lg hover:shadow-glow"
            >
              Shop Collection
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;