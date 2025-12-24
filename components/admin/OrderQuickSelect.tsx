import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingBag, User, DollarSign, Package } from 'lucide-react';
import { api } from '../../services/api';
import { logger } from '../../src/lib/logger';

interface OrderForBilling {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    total_amount: number;
    status: string;
    payment_status: string;
    items: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        price: number;
    }>;
    created_at: string;
}

interface OrderQuickSelectProps {
    onSelect: (order: OrderForBilling) => void;
    onClose: () => void;
}

export function OrderQuickSelect({ onSelect, onClose }: OrderQuickSelectProps) {
    const [orders, setOrders] = useState<OrderForBilling[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderForBilling[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch unpaid orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Fetch all orders and filter for unpaid ones
                const allOrders = await api.orders.getAll();
                const unpaidOrders = allOrders.filter(
                    (o: any) => o.payment_status === 'pending' && o.status !== 'cancelled'
                );
                setOrders(unpaidOrders);
                setFilteredOrders(unpaidOrders);
            } catch (error) {
                logger.error('Error fetching orders:', error, 'OrderQuickSelect');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Filter orders based on search
    useEffect(() => {
        if (!searchTerm) {
            setFilteredOrders(orders);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = orders.filter(
            order =>
                order.customer_name?.toLowerCase().includes(term) ||
                order.customer_email?.toLowerCase().includes(term) ||
                order.id.toLowerCase().includes(term)
        );
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    // Group orders by date
    const groupedOrders = filteredOrders.reduce((groups, order) => {
        const date = order.created_at.split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(order);
        return groups;
    }, {} as Record<string, OrderForBilling[]>);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-glass border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-glow">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold-gradient rounded-lg">
                            <ShoppingBag className="text-midnight" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Select Product Order</h2>
                            <p className="text-subtle-text text-sm">Choose an order to complete billing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by customer name, email, or order ID..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingBag size={48} className="mx-auto mb-4 text-subtle-text opacity-30" />
                            <p className="text-subtle-text">No unpaid orders found</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedOrders)
                                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                                .map(([date, dateOrders]) => (
                                    <div key={date}>
                                        <div className="text-gold font-bold mb-3 flex items-center gap-2">
                                            <Package size={16} />
                                            {new Date(date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>

                                        <div className="space-y-2">
                                            {dateOrders.map((order) => (
                                                <button
                                                    key={order.id}
                                                    onClick={() => onSelect(order)}
                                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-gold/50 transition-all text-left group"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="text-white font-bold group-hover:text-gold transition-colors">
                                                                {order.customer_name || 'Unknown Customer'}
                                                            </div>
                                                            <div className="text-subtle-text text-sm">{order.customer_email}</div>
                                                            <div className="text-subtle-text text-xs mt-1">Order #{order.id.slice(0, 8)}</div>
                                                        </div>
                                                        <div className="text-gold font-mono font-bold">
                                                            ${order.total_amount.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-subtle-text">
                                                        <span className="flex items-center gap-1">
                                                            <Package size={14} />
                                                            {order.items?.length || 0} item(s)
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-lg ${
                                                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
