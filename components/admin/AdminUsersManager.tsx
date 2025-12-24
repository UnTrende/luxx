import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { UserProfile } from '../../types';
import { api } from '../../services/api';
import { Search, Filter, User, Shield, Mail, Check, X, Users, TrendingUp } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminUsersManagerProps {
    users: UserProfile[];
    setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
    showContextBanner?: boolean;
    customerContext?: {
        totalCustomers: number;
        newCustomersThisWeek: number;
        returningRate: number;
    };
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({ users, setUsers, showContextBanner, customerContext }) => {
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [bannerVisible, setBannerVisible] = useState(showContextBanner);

    const handleUserRoleUpdate = async (userId: string, newRole: 'customer' | 'barber' | 'admin') => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            await api.syncUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success('User role updated successfully');
        } catch (error) {
            logger.error('User role update failed:', error, 'AdminUsersManager');
            toast.error('Failed to update user role');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name?.toLowerCase() || '').includes(userSearchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(userSearchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            {/* Context Banner - Shows customer insights from dashboard */}
            {bannerVisible && customerContext && (
                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-5 rounded-xl relative animate-slide-down">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Users className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">👥 Customer Insights</h3>
                                <p className="text-blue-200 text-sm">
                                    <span className="font-bold">{customerContext.totalCustomers} total customers</span> in your database.
                                    {customerContext.newCustomersThisWeek > 0 && (
                                        <> <span className="text-green-400 font-bold">+{customerContext.newCustomersThisWeek} new</span> this week!</>
                                    )}
                                </p>
                                <p className="text-blue-200/70 text-xs mt-1">
                                    Returning customer rate: <span className="font-bold">{customerContext.returningRate}%</span>
                                    {customerContext.returningRate > 50 ? ' - Great loyalty! 🎉' : ' - Consider implementing retention strategies.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setBannerVisible(false)}
                            className="text-blue-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <User size={24} />
                        </span>
                        User Directory
                    </h2>
                    <p className="text-subtle-text text-sm">Manage customer and staff access</p>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
                    <div className="relative flex-1 md:min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="appearance-none bg-black/40 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white focus:outline-none focus:border-gold/50 transition-all cursor-pointer hover:bg-white/5"
                        >
                            <option value="all" className="bg-gray-900">All Roles</option>
                            <option value="customer" className="bg-gray-900">Customers</option>
                            <option value="barber" className="bg-gray-900">Barbers</option>
                            <option value="admin" className="bg-gray-900">Admins</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-glass-card rounded-3xl border border-white/10 overflow-hidden shadow-glass">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">User</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Role</th>
                                <th className="text-right py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-all duration-300 group">
                                    <td className="py-5 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white font-bold shadow-inner">
                                                {user.name?.charAt(0).toUpperCase() || <User size={16} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-gold transition-colors">{user.name || 'Unknown User'}</div>
                                                <div className="text-xs text-subtle-text flex items-center gap-1">
                                                    <Mail size={10} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-8">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                user.role === 'barber' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-white/5 text-subtle-text border-white/10'
                                            }`}>
                                            {user.role === 'admin' && <Shield size={10} />}
                                            {user.role === 'barber' && <ScissorsIcon size={10} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8 text-right">
                                        <div className="inline-flex bg-black/40 rounded-lg border border-white/10 p-1">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleUserRoleUpdate(user.id, e.target.value as any)}
                                                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-2 py-1"
                                            >
                                                <option value="customer" className="bg-gray-900">Customer</option>
                                                <option value="barber" className="bg-gray-900">Barber</option>
                                                <option value="admin" className="bg-gray-900">Admin</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-subtle-text">
                                <User size={24} />
                            </div>
                            <p className="text-subtle-text text-sm">No users found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper icon
const ScissorsIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
);
