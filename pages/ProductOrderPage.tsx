import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Product, ProductOrder } from '../types';
import { Plus, Minus, ShoppingCart, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const ProductOrderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user: loggedInUser } = useAuth();

    useEffect(() => {
        if (!id) return;
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const fetchedProduct = await api.getProductById(id);
                setProduct(fetchedProduct);
                if (fetchedProduct && fetchedProduct.stock === 0) {
                    setQuantity(0);
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
                setProduct(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleQuantityChange = (amount: number) => {
        setQuantity(prev => {
            const newQuantity = prev + amount;
            if (newQuantity < 1) return 1;
            if (product && newQuantity > product.stock) return product.stock;
            return newQuantity;
        });
    };

    const handleConfirmOrder = async () => {
        if (!product || quantity === 0 || !loggedInUser) {
            // Preserve the current path when redirecting to login
            navigate('/login', { state: { from: location.pathname + location.search + location.hash } });
            return;
        }

        setIsSubmitting(true);
        try {
            const newOrder = await api.createProductOrder({ productId: product.id, quantity });
            navigate(`/order-confirmed/${newOrder.id}`);
        } catch (error: any) {
            console.error("Failed to create order:", error);
            // Show the specific error message from the API
            const errorMessage = error.message || error.toString() || "Could not place order. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-12"><Loader size={48} className="animate-spin mx-auto text-dubai-gold" /></div>;
    }

    if (!product) {
        return <div className="text-center text-2xl text-red-400 p-8">Product not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-charcoal-card p-4 md:p-8 rounded-xl shadow-lg">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 border-b border-white/10 pb-3">Confirm Your Order</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                    <img src={resolveProductImage(product)} alt={product.name} className="w-full h-auto object-cover rounded-lg shadow-md" />
                </div>
                <div className="md:w-2/3 space-y-4">
                    <h2 className="text-4xl font-bold">{product.name}</h2>
                    <p className="text-subtle-text">{product.description}</p>
                    <p className="text-3xl font-serif font-bold text-dubai-gold">${(product.price * quantity).toFixed(2)}</p>
                    <p className="text-sm text-yellow-400">{product.stock > 0 ? `${product.stock} available in stock` : 'Out of stock'}</p>

                    {product.stock > 0 && (
                        <div className="flex items-center gap-4 py-4">
                            <h3 className="text-lg font-semibold">Quantity:</h3>
                            <div className="flex items-center border border-dark-text rounded-md">
                                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="p-3 hover:bg-dark-text rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"><Minus size={16} /></button>
                                <span className="px-6 py-2 font-bold text-lg">{quantity}</span>
                                <button onClick={() => handleQuantityChange(1)} disabled={product && quantity >= product.stock} className="p-3 hover:bg-dark-text rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={16} /></button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleConfirmOrder}
                        disabled={product.stock <= 0 || quantity === 0 || isSubmitting}
                        className="w-full flex justify-center items-center gap-3 bg-dubai-gold text-dubai-black font-bold py-4 px-8 rounded-lg hover:bg-white transition-all uppercase tracking-widest disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <><Loader className="animate-spin" />Placing Order...</> : <><ShoppingCart size={20} /> {loggedInUser ? 'Confirm Order' : 'Login to Order'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductOrderPage;