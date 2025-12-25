import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, ArrowLeft, Save, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { logger } from '../src/lib/logger';

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: loggedInUser, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading && !loggedInUser) {
            navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
        }
    }, [loggedInUser, isLoading, navigate, location]);

    useEffect(() => {
        if (loggedInUser) {
            setFormData({
                name: loggedInUser.name || '',
                email: loggedInUser.email || '',
                phone: loggedInUser.phone || '',
            });
        }
    }, [loggedInUser?.id]); // Use stable ID instead of object reference

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Note: This is a placeholder. You'll need to implement the actual API call
            // await api.auth.updateUser({ data: { name: formData.name, phone: formData.phone } });

            toast.success('Profile updated successfully!');
            navigate('/profile');
        } catch (error: Error | unknown) {
            logger.error('Failed to update profile:', error, 'EditProfilePage');
            toast.error(error.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !loggedInUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-midnight">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-midnight pt-8 pb-32 px-6">
            <div className="max-w-lg mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white">Edit Profile</h1>
                        <p className="text-subtle-text text-xs uppercase tracking-widest">Update your information</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-xs text-subtle-text uppercase tracking-widest flex items-center gap-2">
                            <User size={14} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-subtle-text focus:outline-none focus:border-gold/50 transition-colors"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-xs text-subtle-text uppercase tracking-widest flex items-center gap-2">
                            <Mail size={14} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white/50 placeholder-subtle-text cursor-not-allowed"
                            placeholder="your@email.com"
                        />
                        <p className="text-xs text-subtle-text">Email cannot be changed</p>
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label className="text-xs text-subtle-text uppercase tracking-widest flex items-center gap-2">
                            <Phone size={14} />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-subtle-text focus:outline-none focus:border-gold/50 transition-colors"
                            placeholder="+971 XX XXX XXXX"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-4 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader className="animate-spin" size={16} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
