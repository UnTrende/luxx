import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Barber } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';
import { Plus, Edit2, Trash2, Mail, Scissors, User, Award, X } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminBarbersManagerProps {
    barbers: Barber[];
    setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
    showContextBanner?: boolean;
    barberContext?: {
        topBarberName: string;
        topBarberBookings: number;
        avgBookingsPerBarber: number;
        utilizationRate: number;
    };
}

// Local interface for form handling with password field for new barbers
interface BarberFormData extends Barber {
    password?: string; // Only for new barber creation
    bio?: string; // Bio field for barber description
}

export const AdminBarbersManager: React.FC<AdminBarbersManagerProps> = ({ barbers, setBarbers, showContextBanner, barberContext }) => {
    const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
    const [currentBarber, setCurrentBarber] = useState<Barber | null>(null);
    const [barberPhotoUrl, setBarberPhotoUrl] = useState('');
    const [barberPhotoPath, setBarberPhotoPath] = useState('');
    const [bannerVisible, setBannerVisible] = useState(showContextBanner);

    const barberForm = useForm<BarberFormData>();

    const handleBarberSubmit = async (data: BarberFormData) => {
        try {
            // Include image data in barber submission
            const barberData = {
                ...data,
                photo: barberPhotoUrl || data.photo || '',
                photo_path: barberPhotoPath || data.photo_path || '',
                experience: data.experience || 0, // Default experience
                specialties: Array.isArray(data.specialties) ? data.specialties : (data.specialties as unknown as string).split(',').map((s: string) => s.trim())
            };

            // Prepare data for API - ensure strict typing
            const apiData = {
                name: barberData.name,
                photo: barberData.photo,
                experience: barberData.experience,
                specialties: barberData.specialties,
                email: barberData.email,
                password: barberData.password || 'temp1234' // Provide default password if missing for updates (though API might ignore it for updates)
            };

            if (currentBarber) {
                await api.updateBarber(currentBarber.id, barberData);
                setBarbers(prev => prev.map(b => b.id === currentBarber.id ? { ...b, ...barberData } : b));
                toast.success('Barber updated successfully');
            } else {
                const newBarber = await api.addBarber(apiData);
                setBarbers(prev => [...prev, newBarber]);
                toast.success('Barber added successfully');
            }

            setIsBarberModalOpen(false);
            setCurrentBarber(null);
            barberForm.reset();
            setBarberPhotoPath('');
            setBarberPhotoUrl('');
        } catch (error) {
            logger.error('Barber operation failed:', error, 'AdminBarbersManager');
            toast.error('Failed to save barber');
        }
    };

    const handleBarberDelete = async (id: string, userId: string) => {
        if (!window.confirm('Are you sure you want to delete this barber?')) return;

        try {
            await api.deleteBarber(id, userId);
            setBarbers(prev => prev.filter(b => b.id !== id));
            toast.success('Barber deleted successfully');
        } catch (error) {
            logger.error('Barber deletion failed:', error, 'AdminBarbersManager');
            toast.error('Failed to delete barber');
        }
    };

    const openModal = (barber?: Barber) => {
        if (barber) {
            setCurrentBarber(barber);
            barberForm.reset(barber);
            setBarberPhotoUrl(barber.photo || '');
            setBarberPhotoPath(barber.photo_path || '');
        } else {
            setCurrentBarber(null);
            barberForm.reset();
            setBarberPhotoUrl('');
            setBarberPhotoPath('');
        }
        setIsBarberModalOpen(true);
    };

    return (
        <div>
            {/* Context Banner - Shows barber performance from dashboard */}
            {bannerVisible && barberContext && (
                <div className="bg-gold/10 border-l-4 border-gold p-5 rounded-xl relative animate-slide-down mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-gold/20">
                                <Award className="text-gold" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">💈 Barber Performance</h3>
                                <p className="text-yellow-200 text-sm">
                                    <span className="font-bold">{barberContext.topBarberName}</span> is your top performer with <span className="font-bold">{barberContext.topBarberBookings} completed bookings</span>.
                                </p>
                                <p className="text-yellow-200/70 text-xs mt-1">
                                    Average: {barberContext.avgBookingsPerBarber} bookings/barber • Utilization: <span className="font-bold">{barberContext.utilizationRate}%</span>
                                    {barberContext.utilizationRate > 70 ? ' - Excellent! 🔥' : ' - Consider optimizing scheduling.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setBannerVisible(false)}
                            className="text-gold hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white">Staff Management</h2>
                    <p className="text-subtle-text text-sm mt-1">Manage your team of expert barbers</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-gold text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-glow flex items-center gap-2"
                >
                    <Plus size={18} />
                    <span>Add Barber</span>
                </button>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                    <div key={barber.id} className="bg-glass-card rounded-[2rem] p-6 border border-white/10 relative overflow-hidden group hover:border-gold/50 transition-all duration-500 hover:-translate-y-1">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-gold/50 transition-colors">
                                {barber.photo ? (
                                    <img
                                        src={barber.photo}
                                        alt={barber.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'https://via.placeholder.com/160';
                                        }}
                                    />
                                ) : (
                                    <User className="text-white/20" size={32} />
                                )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openModal(barber)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-subtle-text transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleBarberDelete(barber.id, barber.user_id)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-subtle-text transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{barber.name}</h3>
                        <div className="flex items-center gap-2 text-subtle-text text-sm mb-4">
                            <Mail size={14} />
                            <span>{barber.email}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {barber.specialties?.map((specialty, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-subtle-text uppercase tracking-wide group-hover:border-gold/20 transition-colors"
                                >
                                    {specialty}
                                </span>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">Active</span>
                            <span className="text-xs text-white/20 font-mono">ID: {barber.id.slice(0, 6)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {barbers.length === 0 && (
                <div className="text-center py-16 bg-glass-card rounded-[2rem] border border-white/10">
                    <p className="text-subtle-text text-lg">No barbers found.</p>
                </div>
            )}

            {/* Barber Modal */}
            {isBarberModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-glass-card rounded-[2rem] p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scale-in relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

                        <h3 className="text-3xl font-serif font-bold text-white mb-8 text-center">
                            {currentBarber ? 'Edit Barber' : 'New Barber'}
                        </h3>

                        <form onSubmit={barberForm.handleSubmit(handleBarberSubmit)} className="space-y-6">
                            {/* Barber Photo Upload */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">
                                    Barber Photo
                                </label>
                                <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                                    <ImageUpload
                                        onImageUpload={(imagePath: string, publicUrl: string) => {
                                            setBarberPhotoPath(imagePath);
                                            setBarberPhotoUrl(publicUrl);
                                        }}
                                        currentImage={barberPhotoUrl || currentBarber?.photo}
                                        bucket="luxecut-photos"
                                        entityType="barber"
                                        entityId={currentBarber?.id}
                                    />
                                </div>
                            </div>

                            {/* Barber Name */}
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Name *</label>
                                <input
                                    {...barberForm.register('name', { required: 'Name is required' })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="e.g., John Smith"
                                />
                            </div>

                            {/* Email */}
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Email *</label>
                                <input
                                    type="email"
                                    {...barberForm.register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Invalid email format'
                                        }
                                    })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="john@luxecut.com"
                                />
                            </div>

                            {/* Password - Only for new barbers */}
                            {!currentBarber && (
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Password *</label>
                                    <input
                                        type="password"
                                        {...barberForm.register('password', {
                                            required: !currentBarber ? 'Password is required' : false,
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            {/* Specialties */}
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Specialties</label>
                                <input
                                    {...barberForm.register('specialties')}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="Fades, Classic Cuts, Beard Styling (comma separated)"
                                    onChange={(e) => {
                                        // Convert comma-separated string to array
                                        const value = e.target.value;
                                        const specialtiesArray = value.split(',').map(s => s.trim()).filter(s => s);
                                        barberForm.setValue('specialties', specialtiesArray);
                                    }}
                                />
                            </div>

                            {/* Bio */}
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Bio</label>
                                <textarea
                                    {...barberForm.register('bio')} // Bio is not in Barber interface in types.ts but used in form?
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="Brief description about the barber..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBarberModalOpen(false);
                                        setCurrentBarber(null);
                                        barberForm.reset();
                                        setBarberPhotoPath('');
                                        setBarberPhotoUrl('');
                                    }}
                                    className="flex-1 bg-transparent text-subtle-text border border-white/10 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gold text-black py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-glow"
                                >
                                    {currentBarber ? 'Save Changes' : 'Create Barber'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
