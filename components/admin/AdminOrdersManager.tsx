import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { OrderWithDetails } from '../../types';
import { api } from '../../services/api';

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
            console.error('Order status update failed:', error);
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <h2 className="text-2xl font-serif font-bold text-dubai-black">Order History</h2>
                <p className="text-subtle-text text-sm mt-1">Manage product orders and fulfillment</p>

                {/* Search and Filter Controls */}
                <div className="flex flex-wrap gap-4 mt-6">
                    <div className="flex-1 min-w-64">
                        <input
                            type="text"
                            placeholder="Search orders by ID or customer..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dubai-gold/50"
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-dark-grey focus:border-dubai-black focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setOrderSearchTerm('');
                            setStatusFilter('all');
                        }}
                        className="px-4 py-3 text-subtle-text hover:text-dubai-black font-bold transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Order ID</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Customer</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Product</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Amount</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Status</th>
                            <th className="text-right py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-8 font-mono text-sm text-subtle-text">#{order.id.slice(0, 8)}</td>
                                <td className="py-4 px-8 font-medium text-dubai-dark-grey">{order.customer?.name || 'Unknown'}</td>
                                <td className="py-4 px-8 text-subtle-text">{order.products?.name || 'Unknown Product'} (x{order.quantity})</td>
                                <td className="py-4 px-8 font-bold text-dubai-black">${order.totalPrice || order.total_amount || 0}</td>
                                <td className="py-4 px-8">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-red-100 text-red-600'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-4 px-8 text-right">
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-dubai-dark-grey focus:border-dubai-black focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-subtle-text text-lg">No orders found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
