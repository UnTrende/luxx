import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Service } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminServicesManagerProps {
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

export const AdminServicesManager: React.FC<AdminServicesManagerProps> = ({ services, setServices }) => {
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [serviceImageUrl, setServiceImageUrl] = useState('');
    const [serviceImagePath, setServiceImagePath] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
            logger.error('Service operation failed:', error, 'AdminServicesManager');
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
            logger.error('Service deletion failed:', error, 'AdminServicesManager');
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

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-glass-card rounded-[2rem] border border-white/10 overflow-hidden relative">
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">Services Menu</h2>
                    <p className="text-subtle-text text-sm">Manage your service offerings and pricing</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-gold text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-glow flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Add Service</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Name</th>
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Category</th>
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Duration</th>
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Price</th>
                            <th className="text-right py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredServices.map((service) => (
                            <tr key={service.id} className="group hover:bg-white/5 transition-colors">
                                <td className="py-5 px-8 font-medium text-white">
                                    <div className="flex items-center gap-4">
                                        {service.image_url ? (
                                            <img src={service.image_url} alt={service.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-gold/50 transition-colors" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                                <Edit2 size={20} />
                                            </div>
                                        )}
                                        <span className="text-lg">{service.name}</span>
                                    </div>
                                </td>
                                <td className="py-5 px-8">
                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-subtle-text uppercase tracking-wide group-hover:border-gold/30 group-hover:text-white transition-colors">
                                        {service.category}
                                    </span>
                                </td>
                                <td className="py-5 px-8 text-subtle-text font-mono">{service.duration} min</td>
                                <td className="py-5 px-8 font-bold text-gold text-lg">${service.price}</td>
                                <td className="py-5 px-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openModal(service)}
                                            className="p-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold hover:text-white transition-all border border-gold/20"
                                            title="Edit Service"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleServiceDelete(service.id)}
                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
                                            title="Delete Service"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredServices.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-subtle-text text-lg mb-4">No services found.</p>
                        <button
                            onClick={() => openModal()}
                            className="text-gold font-bold hover:underline"
                        >
                            Create your first service
                        </button>
                    </div>
                )}
            </div>

            {/* Glass Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-glass-card rounded-[2rem] p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scale-in relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

                        <h3 className="text-3xl font-serif font-bold text-white mb-8 text-center">
                            {currentService ? 'Edit Service' : 'New Service'}
                        </h3>

                        <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-6">
                            {/* Service Name */}
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Name</label>
                                <input
                                    {...serviceForm.register('name', { required: 'Name is required' })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="e.g., Classic Haircut"
                                />
                            </div>

                            {/* Category */}
                            <div className="group">
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Category</label>
                                <select
                                    {...serviceForm.register('category', { required: 'Category is required' })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all appearance-none"
                                >
                                    <option value="" className="bg-card-bg">Select category</option>
                                    <option value="Haircut" className="bg-card-bg">Haircut</option>
                                    <option value="Beard Care" className="bg-card-bg">Beard Care</option>
                                    <option value="Shaving" className="bg-card-bg">Shaving</option>
                                    <option value="Styling" className="bg-card-bg">Styling</option>
                                    <option value="Special" className="bg-card-bg">Special</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Duration */}
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Duration (min)</label>
                                    <input
                                        type="number"
                                        {...serviceForm.register('duration', { required: 'Duration is required', min: 1 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="30"
                                    />
                                </div>

                                {/* Price */}
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Price ($)</label>
                                    <input
                                        type="number"
                                        {...serviceForm.register('price', { required: 'Price is required', min: 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="40.00"
                                    />
                                </div>
                            </div>

                            {/* Loyalty Points - Tier Based */}
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-3">
                                    🎁 Loyalty Points by Tier
                                </label>
                                <p className="text-xs text-subtle-text mb-4">
                                    Set different point values for each customer tier. Higher tiers receive more points.
                                </p>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Silver Tier */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-gray-400 mb-2 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                                            Silver
                                        </label>
                                        <input
                                            type="number"
                                            {...serviceForm.register('loyalty_points_silver', { required: 'Silver points required', min: 0 })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-center focus:border-gray-400 focus:ring-1 focus:ring-gray-400/20 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="10"
                                        />
                                    </div>

                                    {/* Gold Tier */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-gold mb-2 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-gold"></span>
                                            Gold
                                        </label>
                                        <input
                                            type="number"
                                            {...serviceForm.register('loyalty_points_gold', { required: 'Gold points required', min: 0 })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-center focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="15"
                                        />
                                    </div>

                                    {/* Platinum Tier */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></span>
                                            Platinum
                                        </label>
                                        <input
                                            type="number"
                                            {...serviceForm.register('loyalty_points_platinum', { required: 'Platinum points required', min: 0 })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-center focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="20"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 mt-3">
                                    <p className="text-xs text-gold flex items-start gap-2">
                                        <span>💡</span>
                                        <span>Tip: Platinum customers should receive the most points to reward loyalty. Typical ratio is 1:1.5:2 (Silver:Gold:Platinum)</span>
                                    </p>
                                </div>
                            </div>

                            {/* Points Redemption Settings */}
                            <div className="space-y-4 pt-6 border-t border-white/10">
                                <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
                                    🎁 Reward Redemption
                                </label>
                                <p className="text-xs text-subtle-text mb-4">
                                    Allow customers to redeem points to get this service for FREE
                                </p>

                                {/* Is Redeemable Toggle */}
                                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
                                    <div>
                                        <label className="text-sm font-bold text-white">Enable as Reward</label>
                                        <p className="text-xs text-subtle-text mt-1">Customers can redeem points for this service</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...serviceForm.register('is_redeemable')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-black/40 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-400/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500"></div>
                                    </label>
                                </div>

                                {/* Redemption Points Cost */}
                                <div className="group">
                                    <label className="block text-xs font-semibold text-subtle-text mb-2">
                                        Points Required to Redeem
                                    </label>
                                    <input
                                        type="number"
                                        {...serviceForm.register('redemption_points', { min: 0 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-xl font-bold focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="100"
                                    />
                                    <p className="text-xs text-subtle-text mt-2 text-center">
                                        Customer needs this many points to book for free
                                    </p>
                                </div>

                                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
                                    <p className="text-xs text-cyan-400 flex items-start gap-2">
                                        <span>💡</span>
                                        <span>Example: Set to 100 points → Customer with 150 points can book this service and will have 50 points remaining</span>
                                    </p>
                                </div>
                            </div>

                            {/* Service Image */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">Service Image</label>
                                <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                                    <ImageUpload
                                        currentImage={serviceImageUrl || currentService?.image_url}
                                        onImageUpload={(path, url) => {
                                            setServiceImageUrl(url);
                                            setServiceImagePath(path);
                                        }}
                                        bucket="luxecut-public"
                                        entityType="service"
                                        entityId={currentService?.id}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsServiceModalOpen(false);
                                        setCurrentService(null);
                                        serviceForm.reset();
                                        setServiceImagePath('');
                                        setServiceImageUrl('');
                                    }}
                                    className="flex-1 bg-transparent text-subtle-text border border-white/10 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gold text-black py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-glow"
                                >
                                    {currentService ? 'Save Changes' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
