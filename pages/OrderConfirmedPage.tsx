
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrderWithDetails } from '../types';
import { PartyPopper, Loader } from 'lucide-react';
import { api } from '../services/api';

const OrderConfirmedPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setIsLoading(false);
                return;
            }
            try {
                const fetchedOrder = await api.getOrderById(orderId);
                setOrder(fetchedOrder);
            } catch (error) {
                console.error("Failed to fetch order details:", error);
                setOrder(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    if (isLoading) {
        return <div className="text-center p-12"><Loader size={48} className="animate-spin mx-auto text-dubai-gold" /></div>;
    }

    if (!order || !order.products) {
        return <div className="text-center text-2xl text-red-400 p-8">Order not found.</div>;
    }

    const product = order.products;

    return (
        <div className="text-center max-w-2xl mx-auto bg-charcoal-card p-4 md:p-8 rounded-xl shadow-lg">
            <PartyPopper className="mx-auto text-green-400 h-16 w-16 mb-4" />
            <h1 className="text-3xl font-bold mb-4 text-green-400">Order Placed Successfully!</h1>

            <p className="text-lg text-subtle-text mb-2">Your order has been placed. You can pick it up from our shop anytime during business hours.</p>
            <p className="font-semibold text-dubai-gold mb-8">Delivery will be available soon.</p>

            <div className="bg-dark-text p-6 rounded-lg space-y-4 text-left max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-serif font-bold text-white border-b border-white/10 pb-2 mb-4">Order Summary (ID: {order.id})</h3>
                <div className="flex gap-4">
                    <img src={resolveProductImage(product)} alt={product.name} className="w-24 h-24 object-cover rounded-md" />
                    <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-sm">Quantity: {order.quantity}</p>
                        <p className="font-bold text-lg mt-2">Total: <span className="text-dubai-gold font-serif">${(product.price * order.quantity).toFixed(2)}</span></p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/products" className="bg-dubai-gold text-dubai-black font-bold py-3 px-8 rounded-lg hover:bg-white uppercase tracking-widest">Continue Shopping</Link>
                <Link to="/" className="bg-transparent border-2 border-dubai-gold text-dubai-gold font-bold py-3 px-8 rounded-lg hover:bg-dubai-gold hover:text-dubai-black transition-colors uppercase tracking-widest">Back to Home</Link>
            </div>
        </div>
    );
};

export default OrderConfirmedPage;