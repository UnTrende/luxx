import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { SiteSettings } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';

interface AdminSettingsProps {
    siteSettings: SiteSettings;
    setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ siteSettings, setSiteSettings }) => {
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const settingsForm = useForm<SiteSettings>();

    const handleSettingsSubmit = async (data: SiteSettings) => {
        try {
            // Optimistic update
            setSiteSettings(prev => ({ ...prev, ...data }));

            // Map to API format
            const apiData = {
                shopName: data.shop_name,
                allowSignups: data.allow_signups,
                contactEmail: data.contact_email,
                contactPhone: data.contact_phone,
                location: data.location,
                siteLogo: (data as any).site_logo, // Assuming site_logo might be added to SiteSettings or is an optional field
                // Add other fields as needed
            };

            await api.updateSettings(apiData);
            toast.success('Settings updated successfully');
            setIsSettingsModalOpen(false);
        } catch (error) {
            console.error('Settings update failed:', error);
            toast.error('Failed to update settings');

            // Revert
            const result = await api.getSettings();
            if (result.success) {
                setSiteSettings(result.data);
            }
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 hover:border-dubai-gold/30 transition-all p-8 max-w-2xl shadow-xl shadow-gray-200/50">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-dubai-black">Site Configuration</h2>
                <p className="text-gray-500 text-sm mt-1">Manage general settings and preferences</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                        <h3 className="font-bold text-dubai-black mb-1">Shop Name</h3>
                        <p className="text-sm text-gray-500">The name displayed across the application</p>
                    </div>
                    <div className="text-right">
                        <p className="font-serif font-bold text-lg text-dubai-gold">{siteSettings.shop_name}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                        <h3 className="font-bold text-dubai-black mb-1">Allow Signups</h3>
                        <p className="text-sm text-gray-500">Enable or disable new user registration</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide ${siteSettings.allow_signups ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                        {siteSettings.allow_signups ? 'Enabled' : 'Disabled'}
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                        <h3 className="font-bold text-dubai-black mb-1">Contact Email</h3>
                        <p className="text-sm text-gray-500">Public contact email for customers</p>
                    </div>
                    <div className="text-right">
                        <p className="font-medium text-dubai-black">{siteSettings.contact_email || 'Not set'}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                        <h3 className="font-bold text-dubai-black mb-1">Contact Phone</h3>
                        <p className="text-sm text-gray-500">Public phone number</p>
                    </div>
                    <div className="text-right">
                        <p className="font-medium text-dubai-black">{siteSettings.contact_phone || 'Not set'}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                        <h3 className="font-bold text-dubai-black mb-1">Location</h3>
                        <p className="text-sm text-gray-500">Physical shop address</p>
                    </div>
                    <div className="text-right">
                        <p className="font-medium text-dubai-black">{siteSettings.location || 'Not set'}</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setIsSettingsModalOpen(true);
                        settingsForm.reset(siteSettings);
                    }}
                    className="w-full py-4 bg-dubai-gold text-dubai-black rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                >
                    Edit Settings
                </button>
            </div>

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-serif font-bold text-dubai-black mb-6">
                            Edit Site Settings
                        </h3>

                        <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-5">
                            {/* Shop Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Shop Name</label>
                                <input
                                    {...settingsForm.register('shop_name', { required: 'Shop Name is required' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Allow Signups */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    {...settingsForm.register('allow_signups')}
                                    className="w-5 h-5 rounded border-gray-300 bg-gray-50 text-dubai-gold focus:ring-dubai-gold/50"
                                />
                                <label className="text-sm font-bold text-dubai-black">Allow New User Signups</label>
                            </div>

                            {/* Contact Email */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    {...settingsForm.register('contact_email')}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Contact Phone</label>
                                <input
                                    {...settingsForm.register('contact_phone')}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Location</label>
                                <input
                                    {...settingsForm.register('location')}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-dubai-gold text-dubai-black py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-lg"
                                >
                                    Save Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsModalOpen(false)}
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
