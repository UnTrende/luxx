import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Barber } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';

interface AdminBarbersManagerProps {
    barbers: Barber[];
    setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
}

// Local interface for form handling with password field for new barbers
interface BarberFormData extends Barber {
    password?: string; // Only for new barber creation
    bio?: string; // Bio field for barber description
}

export const AdminBarbersManager: React.FC<AdminBarbersManagerProps> = ({ barbers, setBarbers }) => {
    const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
    const [currentBarber, setCurrentBarber] = useState<Barber | null>(null);
    const [barberPhotoUrl, setBarberPhotoUrl] = useState('');
    const [barberPhotoPath, setBarberPhotoPath] = useState('');

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
            console.error('Barber operation failed:', error);
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
            console.error('Barber deletion failed:', error);
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-dubai-black">Staff Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your team of expert barbers</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-dubai-gold text-dubai-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-md hover:shadow-lg"
                >
                    + Add Barber
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                    <div key={barber.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/50 group hover:border-dubai-gold/50 transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
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
                                    <span className="text-2xl font-serif font-bold text-gray-400">{barber.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openModal(barber)}
                                    className="p-2 rounded-lg bg-gray-100 hover:bg-dubai-gold hover:text-dubai-black text-gray-500 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleBarberDelete(barber.id, barber.user_id)}
                                    className="p-2 rounded-lg bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-serif font-bold text-dubai-black mb-1">{barber.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">{barber.email}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {barber.specialties?.map((specialty, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide"
                                >
                                    {specialty}
                                </span>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded border border-green-200">Active</span>
                            <span className="text-xs text-gray-400 font-mono">ID: {barber.id.slice(0, 6)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {barbers.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <p className="text-gray-500 text-lg">No barbers found.</p>
                </div>
            )}

            {/* Barber Modal */}
            {isBarberModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-serif font-bold text-dubai-black mb-6">
                            {currentBarber ? 'Edit Barber' : 'Add New Barber'}
                        </h3>

                        <form onSubmit={barberForm.handleSubmit(handleBarberSubmit)} className="space-y-5">
                            {/* Barber Photo Upload */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                    Barber Photo
                                </label>
                                <ImageUpload
                                    onImageUploaded={(publicUrl: string, imagePath: string) => {
                                        setBarberPhotoPath(imagePath);
                                        setBarberPhotoUrl(publicUrl);
                                    }}
                                    currentImageUrl={barberPhotoUrl || currentBarber?.photo}
                                    bucket="luxecut-photos"
                                    folder="barbers"
                                    entityType="barber"
                                    entityId={currentBarber?.id}
                                />
                            </div>

                            {/* Barber Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Name *</label>
                                <input
                                    {...barberForm.register('name', { required: 'Name is required' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g., John Smith"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email *</label>
                                <input
                                    type="email"
                                    {...barberForm.register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Invalid email format'
                                        }
                                    })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="john@luxecut.com"
                                />
                            </div>

                            {/* Password - Only for new barbers */}
                            {!currentBarber && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        {...barberForm.register('password', {
                                            required: !currentBarber ? 'Password is required' : false,
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            {/* Specialties */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Specialties</label>
                                <input
                                    {...barberForm.register('specialties')}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
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
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">Bio</label>
                                <textarea
                                    {...barberForm.register('bio')} // Bio is not in Barber interface in types.ts but used in form?
                                    rows={3}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-black focus:ring-1 focus:ring-dubai-black/10 focus:outline-none transition-all"
                                    placeholder="Brief description about the barber..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-dubai-gold text-dubai-black py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-lg"
                                >
                                    {currentBarber ? 'Update Barber' : 'Create Barber'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBarberModalOpen(false);
                                        setCurrentBarber(null);
                                        barberForm.reset();
                                        setBarberPhotoPath('');
                                        setBarberPhotoUrl('');
                                    }}
                                    className="flex-1 bg-transparent text-gray-500 border border-gray-200 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-50 hover:text-dubai-black transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
