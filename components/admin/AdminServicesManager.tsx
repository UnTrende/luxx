import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Service } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';

interface AdminServicesManagerProps {
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

export const AdminServicesManager: React.FC<AdminServicesManagerProps> = ({ services, setServices }) => {
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [serviceImageUrl, setServiceImageUrl] = useState('');
    const [serviceImagePath, setServiceImagePath] = useState('');

    const serviceForm = useForm<Service>();

    const handleServiceSubmit = async (data: Service) => {
        try {
            // Include image data
            const serviceData = {
                ...data,
                image_url: serviceImageUrl || data.image_url || '',
                image_path: serviceImagePath || data.image_path || ''
            };

            if (currentService) {
                await api.updateService(currentService.id, serviceData);
                setServices(prev => prev.map(s => s.id === currentService.id ? { ...s, ...serviceData } : s));
                toast.success('Service updated successfully');
            } else {
                const newService = await api.addService(serviceData);
                setServices(prev => [...prev, newService]);
                toast.success('Service created successfully');
            }

            setIsServiceModalOpen(false);
            setCurrentService(null);
            serviceForm.reset();
            setServiceImagePath('');
            setServiceImageUrl('');
        } catch (error) {
            console.error('Service operation failed:', error);
            toast.error('Failed to save service');
        }
    };

    const handleServiceDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;

        try {
            await api.deleteService(id);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success('Service deleted successfully');
        } catch (error) {
            console.error('Service deletion failed:', error);
            toast.error('Failed to delete service');
        }
    };

    const openModal = (service?: Service) => {
        if (service) {
            setCurrentService(service);
            serviceForm.reset(service);
            setServiceImageUrl(service.image_url || '');
            setServiceImagePath(service.image_path || '');
        } else {
            setCurrentService(null);
            serviceForm.reset();
            setServiceImageUrl('');
            setServiceImagePath('');
        }
        setIsServiceModalOpen(true);
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-dubai-black">Services Menu</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your service offerings and pricing</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-dubai-gold text-dubai-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-md hover:shadow-lg"
                >
                    + Add Service
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Name</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Category</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Duration</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Price</th>
                            <th className="text-right py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {services.map((service) => (
                            <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                <td className="py-5 px-8 font-medium text-dubai-black">
                                    <div className="flex items-center gap-3">
                                        {service.image_url && (
                                            <img src={service.image_url} alt={service.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 group-hover:border-dubai-gold/50 transition-colors" />
                                        )}
                                        {service.name}
                                    </div>
                                </td>
                                <td className="py-5 px-8">
                                    <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide group-hover:border-dubai-gold/30 transition-colors">{service.category}</span>
                                </td>
                                <td className="py-5 px-8 text-gray-500 font-mono">{service.duration} min</td>
                                <td className="py-5 px-8 font-bold text-dubai-gold">${service.price}</td>
                                <td className="py-5 px-8 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => openModal(service)}
                                            className="text-gray-400 hover:text-dubai-gold font-bold text-sm transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleServiceDelete(service.id)}
                                            className="text-gray-400 hover:text-red-500 font-bold text-sm transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {services.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">No services found.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-dubai-gold font-bold hover:underline"
                        >
                            Create your first service
                        </button>
                    </div>
                )}
            </div>

            {/* Service Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-serif font-bold text-dubai-black mb-6">
                            {currentService ? 'Edit Service' : 'Add New Service'}
                        </h3>

                        <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-5">
                            {/* Service Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Name *</label>
                                <input
                                    {...serviceForm.register('name', { required: 'Name is required' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g., Classic Haircut"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category *</label>
                                <select
                                    {...serviceForm.register('category', { required: 'Category is required' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                >
                                    <option value="">Select category</option>
                                    <option value="Haircut">Haircut</option>
                                    <option value="Beard Care">Beard Care</option>
                                    <option value="Shaving">Shaving</option>
                                    <option value="Styling">Styling</option>
                                    <option value="Special">Special</option>
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    {...serviceForm.register('duration', { required: 'Duration is required', min: 1 })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="30"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Price ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...serviceForm.register('price', { required: 'Price is required', min: 0 })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="40.00"
                                />
                            </div>

                            {/* Service Image */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Service Image</label>
                                <ImageUpload
                                    currentImageUrl={serviceImageUrl || currentService?.image_url}
                                    onImageUploaded={(url, path) => {
                                        setServiceImageUrl(url);
                                        setServiceImagePath(path);
                                    }}
                                    bucket="luxecut-public"
                                    folder="services"
                                    entityType="service"
                                    entityId={currentService?.id}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-dubai-gold text-dubai-black py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-lg"
                                >
                                    {currentService ? 'Update Service' : 'Create Service'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsServiceModalOpen(false);
                                        setCurrentService(null);
                                        serviceForm.reset();
                                        setServiceImagePath('');
                                        setServiceImageUrl('');
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
