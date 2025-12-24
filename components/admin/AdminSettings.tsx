import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { SiteSettings } from '../../types';
import { api } from '../../services/api';
import { Settings, Save, X, Building, Mail, Phone, MapPin, Globe, Shield, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '../ImageUpload';
import { logger } from '../../src/lib/logger';

interface AdminSettingsProps {
    siteSettings: SiteSettings;
    setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ siteSettings, setSiteSettings }) => {
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [heroImages, setHeroImages] = useState<string[]>([]);
    const [heroImagePaths, setHeroImagePaths] = useState<string[]>([]);
    const settingsForm = useForm<SiteSettings>();

    // Initialize hero images when siteSettings change
    useEffect(() => {
        if (siteSettings.hero_images) {
            setHeroImagePaths(siteSettings.hero_images);
            // Convert paths to full URLs for display
            const urls = siteSettings.hero_images.map(path => 
                path ? `/storage/v1/object/public/hero-images/${path}` : ''
            );
            setHeroImages(urls);
        } else {
            // Initialize with empty arrays if no hero images exist
            setHeroImagePaths([]);
            setHeroImages([]);
        }
    }, [siteSettings]);

    const handleSettingsSubmit = async (data: SiteSettings) => {
        try {
            // Filter out empty paths
            const filteredHeroImagePaths = heroImagePaths.filter(path => path !== '');

            // Combine existing settings with hero images
            const updatedSettings = {
                ...data,
                hero_images: filteredHeroImagePaths
            };

            logger.info('🔧 Saving settings:', { data, heroImagePaths, filteredHeroImagePaths, updatedSettings }, 'AdminSettings');

            // Optimistic update
            setSiteSettings(prev => ({ ...prev, ...updatedSettings }));

            // Map to API format
            const apiData = {
                shopName: data.shop_name,
                allowSignups: data.allow_signups,
                contactEmail: data.contact_email,
                contactPhone: data.contact_phone,
                location: data.location,
                siteLogo: (data as any).site_logo,
                heroImages: filteredHeroImagePaths
            };

            logger.info('🔧 Sending API data:', apiData, 'AdminSettings');

            await api.updateSettings(apiData);
            toast.success('Settings updated successfully');
            setIsSettingsModalOpen(false);
        } catch (error) {
            logger.error('Settings update failed:', error, 'AdminSettings');
            toast.error('Failed to update settings');

            // Revert
            const result = await api.getSettings();
            if (result.success) {
                setSiteSettings(result.data);
                if (result.data.hero_images) {
                    setHeroImagePaths(result.data.hero_images);
                    // Convert paths to full URLs for display
                    const urls = result.data.hero_images.map(path => 
                        path ? `/storage/v1/object/public/hero-images/${path}` : ''
                    );
                    setHeroImages(urls);
                } else {
                    setHeroImagePaths([]);
                    setHeroImages([]);
                }
            }
        }
    };

    const handleHeroImageUpload = (index: number, imagePath: string, publicUrl: string) => {
        const newPaths = [...heroImagePaths];
        const newUrls = [...heroImages];
        
        if (imagePath) {
            newPaths[index] = imagePath;
            newUrls[index] = publicUrl;
        } else {
            // Remove image
            newPaths.splice(index, 1);
            newUrls.splice(index, 1);
        }
        
        setHeroImagePaths(newPaths);
        setHeroImages(newUrls);
    };

    const addHeroImageSlot = () => {
        setHeroImagePaths([...heroImagePaths, '']);
        setHeroImages([...heroImages, '']);
    };

    const removeHeroImage = (index: number) => {
        const newPaths = [...heroImagePaths];
        const newUrls = [...heroImages];
        newPaths.splice(index, 1);
        newUrls.splice(index, 1);
        setHeroImagePaths(newPaths);
        setHeroImages(newUrls);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="relative bg-glass-card p-8 rounded-3xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
                            <Settings size={24} />
                        </span>
                        Site Configuration
                    </h2>
                    <p className="text-subtle-text text-sm">Manage general settings and preferences</p>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Shop Name */}
                <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-gold/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                            <Building size={20} />
                        </div>
                    </div>
                    <h3 className="text-subtle-text text-xs font-bold uppercase tracking-wider mb-1">Shop Name</h3>
                    <p className="text-2xl font-serif font-bold text-white group-hover:text-gold transition-colors">{siteSettings.shop_name}</p>
                </div>

                {/* Signups */}
                <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-gold/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                            <Shield size={20} />
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${siteSettings.allow_signups ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {siteSettings.allow_signups ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                    <h3 className="text-subtle-text text-xs font-bold uppercase tracking-wider mb-1">New User Signups</h3>
                    <p className="text-sm text-white/80">Control whether new users can register accounts.</p>
                </div>

                {/* Contact Email */}
                <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-gold/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                            <Mail size={20} />
                        </div>
                    </div>
                    <h3 className="text-subtle-text text-xs font-bold uppercase tracking-wider mb-1">Contact Email</h3>
                    <p className="text-lg font-mono text-white group-hover:text-gold transition-colors">{siteSettings.contact_email || 'Not set'}</p>
                </div>

                {/* Contact Phone */}
                <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-gold/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
                            <Phone size={20} />
                        </div>
                    </div>
                    <h3 className="text-subtle-text text-xs font-bold uppercase tracking-wider mb-1">Contact Phone</h3>
                    <p className="text-lg font-mono text-white group-hover:text-gold transition-colors">{siteSettings.contact_phone || 'Not set'}</p>
                </div>

                {/* Location */}
                <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-gold/30 transition-all group md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                            <MapPin size={20} />
                        </div>
                    </div>
                    <h3 className="text-subtle-text text-xs font-bold uppercase tracking-wider mb-1">Location</h3>
                    <p className="text-lg text-white group-hover:text-gold transition-colors">{siteSettings.location || 'Not set'}</p>
                </div>
            </div>

            <button
                onClick={() => {
                    setIsSettingsModalOpen(true);
                    settingsForm.reset(siteSettings);
                }}
                className="w-full py-4 bg-gold text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2"
            >
                <Settings size={18} />
                Edit Settings
            </button>

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-glass-card rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none rounded-t-3xl" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                                    <Settings size={24} className="text-gold" />
                                    Edit Settings
                                </h3>
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-6">
                                {/* Shop Name */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Shop Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                                        <input
                                            {...settingsForm.register('shop_name', { required: 'Shop Name is required' })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                                            placeholder="Enter shop name"
                                        />
                                    </div>
                                </div>

                                {/* Allow Signups */}
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <input
                                        type="checkbox"
                                        {...settingsForm.register('allow_signups')}
                                        className="w-5 h-5 rounded border-white/20 bg-black/40 text-gold focus:ring-gold/50"
                                    />
                                    <label className="text-sm font-bold text-white">Allow New User Signups</label>
                                </div>

                                {/* Tax Rate */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Tax Rate (%)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text font-bold">%</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            {...settingsForm.register('tax_rate', { 
                                                required: 'Tax rate is required',
                                                min: { value: 0, message: 'Tax rate cannot be negative' },
                                                max: { value: 100, message: 'Tax rate cannot exceed 100%' }
                                            })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                                            placeholder="e.g., 10"
                                        />
                                    </div>
                                    <p className="text-xs text-subtle-text mt-2">This tax rate will be applied to all transactions in the billing system</p>
                                </div>

                                {/* Contact Email */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Contact Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                                        <input
                                            type="email"
                                            {...settingsForm.register('contact_email')}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                                            placeholder="contact@example.com"
                                        />
                                    </div>
                                </div>

                                {/* Contact Phone */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Contact Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                                        <input
                                            {...settingsForm.register('contact_phone')}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gold mb-2">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                                        <input
                                            {...settingsForm.register('location')}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                                            placeholder="123 Main St, City, Country"
                                        />
                                    </div>
                                </div>

                                {/* Hero Images */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gold">Hero Images</label>
                                        <button
                                            type="button"
                                            onClick={addHeroImageSlot}
                                            className="text-xs bg-gold/10 text-gold px-2 py-1 rounded-lg hover:bg-gold/20 transition-colors"
                                        >
                                            Add Image
                                        </button>
                                    </div>
                                    <p className="text-xs text-subtle-text mb-4">Recommended size: 1920x1080px (16:9 ratio)</p>
                                    
                                    <div className="space-y-4">
                                        {heroImagePaths.map((_, index) => (
                                            <div key={index} className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <ImageUpload
                                                        onImageUpload={(path, url) => handleHeroImageUpload(index, path, url)}
                                                        currentImage={heroImages[index]}
                                                        bucket="hero-images"
                                                        entityType="site"
                                                    />
                                                </div>
                                                {heroImagePaths.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeHeroImage(index)}
                                                        className="mt-2 text-red-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gold text-black py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
