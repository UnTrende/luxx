import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrderWithDetails } from '../types';
import { ShoppingBag, Loader, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-toastify';

const MyOrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: loggedInUser, isLoading: isAuthLoading } = useAuth();

    const [myOrders, setMyOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !loggedInUser) {
            navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
        }
    }, [loggedInUser, isAuthLoading, navigate, location]);

    useEffect(() => {
        if (loggedInUser) {
            const fetchOrders = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const orders = await api.getMyOrders();
                    setMyOrders(orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                } catch (err) {
                    setError('Failed to load your orders. Please try again.');
                    toast.error('Failed to load your orders. Please try again.');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchOrders();
        }
    }, [loggedInUser]);

    const getStatusChip = (status: OrderWithDetails['status']) => {
        switch (status) {
            case 'PickedUp': return 'bg-green-500/20 text-green-300 border border-green-500/30';
            case 'Reserved': return 'bg-dubai-gold/20 text-dubai-gold border border-dubai-gold/30';
            default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
        }
    };

    if (isAuthLoading || !loggedInUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin text-dubai-gold" size={48} />
            </div>
        );
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-16">
                    <Loader className="animate-spin mx-auto text-dubai-gold" size={48} />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-16 text-red-400">
                    <p>{error}</p>
                </div>
            );
        }

        if (myOrders.length === 0) {
            return (
                <div className="text-center py-20">
                    <div className="w-24 h-24 rounded-full bg-dubai-gold/10 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={48} className="text-dubai-gold" />
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-white mb-3">No Orders Yet</h3>
                    <p className="text-subtle-text mb-8 max-w-md mx-auto text-lg">
                        Discover our curated collection of premium grooming products.
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-8 py-4 bg-dubai-gold text-dubai-black font-bold rounded-xl hover:brightness-110 transition-all text-lg"
                    >
                        Shop Products
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {myOrders.map(order => {
                    const product = order.products;
                    if (!product) return null;

                    return (
                        <div
                            key={order.id}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-dubai-gold/30 transition-all duration-300 group"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex gap-4 flex-1">
                                    {product.imageUrl && (
                                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Package size={20} className="text-dubai-gold" />
                                            <p className="text-xl font-serif font-bold text-white">{product.name}</p>
                                        </div>
                                        <p className="text-subtle-text text-sm mb-1">Order ID: {order.id.slice(0, 8)}...</p>
                                        <p className="text-subtle-text text-sm">
                                            Ordered on {new Date(order.timestamp).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-3 justify-between">
                                    <div className="text-right">
                                        <p className="text-3xl font-serif font-bold text-dubai-gold">
                                            ${(product.price * order.quantity).toFixed(2)}
                                        </p>
                                        <p className="text-subtle-text text-sm mt-1">Quantity: {order.quantity}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusChip(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-serif font-bold text-white mb-3">My Orders</h1>
                <div className="w-24 h-1 bg-dubai-gold mx-auto rounded-full" />
            </div>

            {/* Orders Container */}
            <div className="bg-dubai-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                {renderContent()}
            </div>
        </div>
    );
};

export default MyOrdersPage;