import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LoyaltySettings } from '../types';

const AdminLoyaltySettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user: loggedInUser, isLoading } = useAuth();
    const [settings, setSettings] = useState<LoyaltySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formState, setFormState] = useState({
        service_rate_silver: 5.00,
        service_rate_gold: 10.00,
        service_rate_platinum: 15.00,
        silver_threshold: 100,
        gold_threshold: 200,
        platinum_threshold: 9999,
        late_cancellation_penalty: 500,
        no_show_penalty: 1000
    });

    useEffect(() => {
        if (!isLoading && (!loggedInUser || loggedInUser.role !== 'admin')) {
            navigate('/login');
            return;
        }

        fetchSettings();
    }, [loggedInUser, isLoading, navigate]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            // Fetch real settings from database
            const response = await api.getLoyaltySettings();
            
            if (response.success && response.settings) {
                setFormState({
                    service_rate_silver: response.settings.service_rate_silver,
                    service_rate_gold: response.settings.service_rate_gold,
                    service_rate_platinum: response.settings.service_rate_platinum,
                    silver_threshold: response.settings.silver_threshold,
                    gold_threshold: response.settings.gold_threshold,
                    platinum_threshold: response.settings.platinum_threshold,
                    late_cancellation_penalty: response.settings.late_cancellation_penalty,
                    no_show_penalty: response.settings.no_show_penalty
                });
                setSettings(response.settings as any);
            } else {
                // Fallback to default values if settings don't exist
                setFormState({
                    service_rate_silver: 5.00,
                    service_rate_gold: 10.00,
                    service_rate_platinum: 15.00,
                    silver_threshold: 100,
                    gold_threshold: 200,
                    platinum_threshold: 9999,
                    late_cancellation_penalty: 500,
                    no_show_penalty: 1000
                });
            }
        } catch (err) {
            setError('Failed to load loyalty settings');
            console.error(err);
            // Use defaults on error
            setFormState({
                service_rate_silver: 5.00,
                service_rate_gold: 10.00,
                service_rate_platinum: 15.00,
                silver_threshold: 100,
                gold_threshold: 200,
                platinum_threshold: 9999,
                late_cancellation_penalty: 500,
                no_show_penalty: 1000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.updateLoyaltySettings(formState);
            alert('Loyalty settings updated successfully!');
        } catch (err) {
            setError('Failed to update loyalty settings');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10">Loading...</div>;
    }

    if (!loggedInUser || loggedInUser.role !== 'admin') {
        return <div className="text-center p-10">Access denied. Admins only.</div>;
    }

    return (
        <div className="min-h-screen bg-midnight pt-8 pb-32 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-serif font-bold text-white">Loyalty Program Settings</h1>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 bg-gold text-black rounded-lg font-medium"
                    >
                        Back to Admin
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="bg-glass-card border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Program Configuration</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tier Multipliers */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Points Multipliers</h3>
                                
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">
                                        Silver Tier (points per $1 spent)
                                    </label>
                                    <input
                                        type="number"
                                        name="service_rate_silver"
                                        value={formState.service_rate_silver}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">
                                        Gold Tier (points per $1 spent)
                                    </label>
                                    <input
                                        type="number"
                                        name="service_rate_gold"
                                        value={formState.service_rate_gold}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">
                                        Platinum Tier (points per $1 spent)
                                    </label>
                                    <input
                                        type="number"
                                        name="service_rate_platinum"
                                        value={formState.service_rate_platinum}
                                        onChange={handleInputChange}
                                        step="0.1"
                                        min="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                            </div>
                            
                            {/* Tier Thresholds */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Tier Thresholds</h3>
                                
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">
                                        Silver to Gold Upgrade (visits)
                                    </label>
                                    <input
                                        type="number"
                                        name="silver_threshold"
                                        value={formState.silver_threshold}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">
                                        Gold to Platinum Upgrade (visits)
                                    </label>
                                    <input
                                        type="number"
                                        name="gold_threshold"
                                        value={formState.gold_threshold}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">
                                        Platinum Threshold (visits)
                                    </label>
                                    <input
                                        type="number"
                                        name="platinum_threshold"
                                        value={formState.platinum_threshold}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                            </div>
                            
                            {/* Penalties */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Penalty Settings</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm text-subtle-text mb-2">
                                            Late Cancellation Penalty (points)
                                        </label>
                                        <input
                                            type="number"
                                            name="late_cancellation_penalty"
                                            value={formState.late_cancellation_penalty}
                                            onChange={handleInputChange}
                                            min="0"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm text-subtle-text mb-2">
                                            No-Show Penalty (points)
                                        </label>
                                        <input
                                            type="number"
                                            name="no_show_penalty"
                                            value={formState.no_show_penalty}
                                            onChange={handleInputChange}
                                            min="0"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 bg-gold text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="bg-glass-card border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Loyalty Program Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-white mb-2">Tier Structure</h3>
                            <ul className="text-sm text-subtle-text space-y-1">
                                <li>• Silver: Base tier for all customers</li>
                                <li>• Gold: After 100 confirmed visits</li>
                                <li>• Platinum: After 200 confirmed visits</li>
                            </ul>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-white mb-2">Earning Points</h3>
                            <ul className="text-sm text-subtle-text space-y-1">
                                <li>• Points earned based on dollars spent</li>
                                <li>• Multiplier increases with tier level</li>
                                <li>• Higher tiers = more points per dollar</li>
                            </ul>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-white mb-2">Penalty System</h3>
                            <ul className="text-sm text-subtle-text space-y-1">
                                <li>• Late cancellation: -500 points</li>
                                <li>• No-show: -1000 points</li>
                                <li>• Minimum balance: 0 points</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoyaltySettingsPage;