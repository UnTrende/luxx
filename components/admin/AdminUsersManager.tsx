import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { UserProfile } from '../../types';
import { api } from '../../services/api';

interface AdminUsersManagerProps {
    users: UserProfile[];
    setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({ users, setUsers }) => {
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const handleUserRoleUpdate = async (userId: string, newRole: 'customer' | 'barber' | 'admin') => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            await api.syncUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success('User role updated successfully');
        } catch (error) {
            console.error('User role update failed:', error);
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
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50">
            <div className="p-8 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-dubai-black">User Directory</h2>
                        <p className="text-gray-500 text-sm mt-1">Total Users: {users.length} | Showing: {filteredUsers.length}</p>
                    </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-dubai-black focus:outline-none focus:ring-1 focus:ring-dubai-gold/50 placeholder:text-gray-400"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="all" className="bg-white text-dubai-black">All Roles</option>
                            <option value="customer" className="bg-white text-dubai-black">Customer</option>
                            <option value="barber" className="bg-white text-dubai-black">Barber</option>
                            <option value="admin" className="bg-white text-dubai-black">Admin</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setUserSearchTerm('');
                            setRoleFilter('all');
                        }}
                        className="px-4 py-3 text-gray-500 hover:text-dubai-black font-bold transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">

                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">User</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Email</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Role</th>
                            <th className="text-right py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                <td className="py-5 px-8 font-medium text-dubai-black">{user.name}</td>
                                <td className="py-5 px-8 text-gray-500">{user.email}</td>
                                <td className="py-5 px-8">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.role === 'admin' ? 'bg-purple-100 text-purple-600 border border-purple-200' :
                                        user.role === 'barber' ? 'bg-blue-100 text-blue-600 border border-blue-200' :
                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-5 px-8 text-right">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleUserRoleUpdate(user.id, e.target.value as any)}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-dubai-black focus:border-dubai-gold focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <option value="customer" className="bg-white text-dubai-black">Customer</option>
                                        <option value="barber" className="bg-white text-dubai-black">Barber</option>
                                        <option value="admin" className="bg-white text-dubai-black">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">No users found matching your search.</p>
                    </div>
                )}
            </div>
        </div>

    );
};
