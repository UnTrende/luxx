import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { OrderWithDetails } from '../../types';
import { api } from '../../services/api';
import { Search, Filter, Package, ShoppingBag, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminOrdersManagerProps {
    orders: OrderWithDetails[];
    setOrders: React.Dispatch<React.SetStateAction<OrderWithDetails[]>>;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({ orders, setOrders }) => {
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));

            // Persist to database
            await api.updateOrderStatus(orderId, newStatus);
            toast.success('Order status updated successfully');
        } catch (error) {
            logger.error('Order status update failed:', error, 'AdminOrdersManager');
            toast.error('Failed to update order status');

            // Revert on error
            const orders = await api.getAllOrders();
            setOrders(orders || []);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.id.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
            (order.customer?.name || '').toLowerCase().includes(orderSearchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Package size={24} />
                        </span>
                        Order History
                    </h2>
                    <p className="text-subtle-text text-sm">Manage product orders and fulfillment</p>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
                    <div className="relative flex-1 md:min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-subtle-text focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-black/40 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white focus:outline-none focus:border-gold/50 transition-all cursor-pointer hover:bg-white/5"
                        >
                            <option value="all" className="bg-gray-900">All Statuses</option>
                            <option value="pending" className="bg-gray-900">Pending</option>
                            <option value="confirmed" className="bg-gray-900">Confirmed</option>
                            <option value="shipped" className="bg-gray-900">Shipped</option>
                            <option value="delivered" className="bg-gray-900">Delivered</option>
                            <option value="cancelled" className="bg-gray-900">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-glass-card rounded-3xl border border-white/10 overflow-hidden shadow-glass">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Order ID</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Customer</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Product</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Amount</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Status</th>
                                <th className="text-right py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-all duration-300 group">
                                    <td className="py-5 px-8 font-mono text-xs text-subtle-text">
                                        <span className="bg-white/5 px-2 py-1 rounded border border-white/5">#{order.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="py-5 px-8 font-bold text-white group-hover:text-gold transition-colors">{order.customer?.name || 'Unknown'}</td>
                                    <td className="py-5 px-8">
                                        <div className="flex items-center gap-2 text-subtle-text text-sm">
                                            <ShoppingBag size={14} className="text-purple-400" />
                                            {order.products?.name || 'Unknown Product'} <span className="text-white/30">x{order.quantity}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-8 font-mono font-bold text-green-400">${order.totalPrice || order.total_amount || 0}</td>
                                    <td className="py-5 px-8">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {order.status === 'delivered' && <CheckCircle size={12} />}
                                            {order.status === 'shipped' && <Truck size={12} />}
                                            {order.status === 'pending' && <Clock size={12} />}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8 text-right">
                                        <div className="inline-flex bg-black/40 rounded-lg border border-white/10 p-1">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                                                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-2 py-1"
                                            >
                                                <option value="pending" className="bg-gray-900">Pending</option>
                                                <option value="confirmed" className="bg-gray-900">Confirmed</option>
                                                <option value="shipped" className="bg-gray-900">Shipped</option>
                                                <option value="delivered" className="bg-gray-900">Delivered</option>
                                                <option value="cancelled" className="bg-gray-900">Cancelled</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredOrders.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-subtle-text">
                                <Package size={24} />
                            </div>
                            <p className="text-subtle-text text-sm">No orders found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
