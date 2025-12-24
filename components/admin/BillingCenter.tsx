import React, { useState, useEffect } from 'react';
import { DollarSign, User, Phone, CreditCard, Printer, Receipt, Users, Calendar, Plus, ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import { ServiceSelector } from './ServiceSelector';
import { BookingQuickSelect } from './BookingQuickSelect';
import { OrderQuickSelect } from './OrderQuickSelect';
import { ReceiptPreview } from './ReceiptPreview';
import { logger } from '../../src/lib/logger';

interface ServiceItem {
    service_id?: string;
    service_name: string;
    price: number;
}

interface BookingForBilling {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    barber_id: string;
    barber_name: string;
    date: string;
    timeSlot: string;
    totalPrice: number;
    status: string;
    services: unknown[];
    serviceIds: string[];
}

export function BillingCenter() {
    // State management
    const [customerType, setCustomerType] = useState<'walk-in' | 'booking' | 'order'>('walk-in');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<BookingForBilling | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [barberId, setBarberId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
    const [taxRate, setTaxRate] = useState(10);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [latestTransaction, setLatestTransaction] = useState<any>(null);
    const [barbers, setBarbers] = useState<any[]>([]);

    // Fetch barbers list
    useEffect(() => {
        const fetchBarbers = async () => {
            try {
                const barbersData = await api.getBarbers();
                setBarbers(barbersData);
            } catch (error) {
                logger.error('Error fetching barbers:', error, 'BillingCenter');
            }
        };
        fetchBarbers();
    }, []);

    // Fetch tax rate from settings
    useEffect(() => {
        const fetchTaxRate = async () => {
            try {
                const settings = await api.getSettings();
                if (settings.tax_rate) {
                    setTaxRate(parseFloat(settings.tax_rate));
                }
            } catch (error) {
                logger.error('Error fetching tax rate:', error, 'BillingCenter');
            }
        };
        fetchTaxRate();
    }, []);

    // Calculate totals
    const subtotal = services.reduce((sum, service) => sum + service.price, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Handle booking selection
    const handleBookingSelected = (booking: BookingForBilling) => {
        setSelectedBooking(booking);
        setCustomerName(booking.customer_name);
        setCustomerPhone(booking.customer_phone);
        setBarberId(booking.barber_id);

        // Convert booking services to ServiceItem format
        const bookingServices: ServiceItem[] = booking.services.map(s => ({
            service_id: s.id,
            service_name: s.name,
            price: s.price
        }));
        setServices(bookingServices);
        setShowBookingModal(false);
    };

    // Handle order selection
    const handleOrderSelected = (order: any) => {
        setSelectedOrder(order);
        setCustomerName(order.customer_name || 'Unknown Customer');
        setCustomerPhone(order.customer_email);

        // Convert order items to ServiceItem format (treating products as services)
        const orderServices: ServiceItem[] = (order.items || []).map((item: any) => ({
            service_id: item.product_id,
            service_name: `${item.product_name} (x${item.quantity})`,
            price: item.price * item.quantity
        }));
        setServices(orderServices);
        setShowOrderModal(false);
    };

    // Handle form reset
    const resetForm = () => {
        setCustomerType('walk-in');
        setCustomerName('');
        setCustomerPhone('');
        setSelectedBooking(null);
        setSelectedOrder(null);
        setServices([]);
        setBarberId('');
        setPaymentMethod('cash');
        setShowReceipt(false);
        setLatestTransaction(null);
    };

    // Handle transaction creation
    const handleCreateTransaction = async () => {
        // Validation
        if (!customerName || !customerPhone) {
            toast.error('Customer name and phone are required');
            return;
        }

        if (services.length === 0) {
            toast.error('Please add at least one service');
            return;
        }

        setIsProcessing(true);

        try {
            // Check authentication before proceeding
            logger.info('🔐 Checking authentication...', undefined, 'BillingCenter');
            const { data: { session } } = await api.supabase.auth.getSession();
            
            if (!session) {
                toast.error('You are not logged in. Please log in as an admin.');
                setIsProcessing(false);
                return;
            }

            logger.info('✅ Session valid, user ID:', session.user.id, 'BillingCenter');
            logger.info('👤 User role:', session.user.app_metadata?.role, 'BillingCenter');

            if (session.user.app_metadata?.role !== 'admin') {
                toast.error('You must be logged in as an admin to create transactions.');
                setIsProcessing(false);
                return;
            }

            const transactionData = {
                customerName,
                customerPhone,
                customerId: selectedBooking?.customer_id || selectedOrder?.customer_id,
                customerType,
                services,
                barberId: barberId || undefined,
                bookingId: selectedBooking?.id,
                orderId: selectedOrder?.id,
                paymentMethod
            };

            logger.info('📤 Sending transaction data:', transactionData, 'BillingCenter');

            const transaction = await api.createTransaction(transactionData);

            logger.info('✅ Transaction created successfully:', transaction, 'BillingCenter');

            // If this was for a product order, mark it as paid
            if (selectedOrder?.id) {
                try {
                    await api.orders.updateOrderStatus(selectedOrder.id, 'completed', 'paid');
                    logger.info('✅ Order marked as paid:', selectedOrder.id, 'BillingCenter');
                } catch (error) {
                    logger.error('Error updating order status:', error, 'BillingCenter');
                    // Don't fail the transaction if order update fails
                }
            }

            setLatestTransaction(transaction);
            setShowReceipt(true);
            toast.success('Transaction completed successfully!');

            // Reset form
            setCustomerName('');
            setCustomerPhone('');
            setServices([]);
            setSelectedBooking(null);
            setSelectedOrder(null);
            setBarberId('');
            setPaymentMethod('cash');

        } catch (error: Error | unknown) {
            logger.error('❌ Transaction error:', error, 'BillingCenter');
            
            // More detailed error messages
            if (error.message?.includes('403')) {
                toast.error('Access denied. Please ensure you are logged in as an admin.');
            } else if (error.message?.includes('401')) {
                toast.error('Your session has expired. Please log in again.');
            } else if (error.message?.includes('Failed to fetch')) {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error(`Failed to create transaction: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle print receipt
    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gold-gradient rounded-xl">
                        <DollarSign className="text-midnight" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-white">Billing Center</h2>
                        <p className="text-subtle-text text-sm">Process walk-ins and complete bookings</p>
                    </div>
                </div>
                {!showReceipt && services.length > 0 && (
                    <div className="bg-glass px-6 py-3 rounded-xl border border-white/10">
                        <div className="text-xs text-subtle-text uppercase tracking-wider mb-1">Total Due</div>
                        <div className="text-3xl font-bold text-gold">${total.toFixed(2)}</div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            {showReceipt && latestTransaction ? (
                <div className="space-y-4">
                    <ReceiptPreview
                        transaction={latestTransaction}
                        onClose={resetForm}
                        onPrint={handlePrintReceipt}
                    />
                    <button
                        onClick={resetForm}
                        className="w-full py-4 bg-glass border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-colors"
                    >
                        New Transaction
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column - Customer Info & Services */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Customer Type Toggle */}
                        <div className="bg-glass p-6 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <Users size={20} className="text-gold" />
                                <h3 className="text-lg font-bold text-white">Customer Type</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => {
                                        setCustomerType('walk-in');
                                        setSelectedBooking(null);
                                        setSelectedOrder(null);
                                        setServices([]);
                                    }}
                                    className={`p-4 rounded-xl transition-all ${customerType === 'walk-in'
                                        ? 'bg-gold-gradient text-midnight font-bold shadow-glow'
                                        : 'bg-white/5 text-white hover:bg-white/10'
                                        }`}
                                >
                                    <User className="mx-auto mb-2" size={24} />
                                    Walk-in
                                </button>
                                <button
                                    onClick={() => {
                                        setCustomerType('booking');
                                        setShowBookingModal(true);
                                    }}
                                    className={`p-4 rounded-xl transition-all ${customerType === 'booking'
                                        ? 'bg-gold-gradient text-midnight font-bold shadow-glow'
                                        : 'bg-white/5 text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Calendar className="mx-auto mb-2" size={24} />
                                    Booking
                                </button>
                                <button
                                    onClick={() => {
                                        setCustomerType('order');
                                        setShowOrderModal(true);
                                    }}
                                    className={`p-4 rounded-xl transition-all ${customerType === 'order'
                                        ? 'bg-gold-gradient text-midnight font-bold shadow-glow'
                                        : 'bg-white/5 text-white hover:bg-white/10'
                                        }`}
                                >
                                    <ShoppingBag className="mx-auto mb-2" size={24} />
                                    Product Order
                                </button>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-glass p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Customer Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">Customer Name *</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter customer name"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                                        disabled={customerType === 'booking' && !!selectedBooking}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-subtle-text mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                                        disabled={customerType === 'booking' && !!selectedBooking}
                                    />
                                </div>

                                {customerType === 'booking' && (
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        className="w-full py-3 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2"
                                    >
                                        <Calendar size={20} />
                                        {selectedBooking ? 'Change Booking' : 'Select Booking'}
                                    </button>
                                )}

                                {customerType === 'order' && (
                                    <button
                                        onClick={() => setShowOrderModal(true)}
                                        className="w-full py-3 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={20} />
                                        {selectedOrder ? 'Change Order' : 'Select Product Order'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Services */}
                        <div className="bg-glass p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Services</h3>
                            <ServiceSelector
                                services={services}
                                onServicesChange={setServices}
                            />
                        </div>
                    </div>

                    {/* Right Column - Payment & Summary */}
                    <div className="space-y-6">
                        {/* Optional Barber */}
                        <div className="bg-glass p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Barber (Optional)</h3>
                            <select
                                value={barberId}
                                onChange={(e) => setBarberId(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold transition-colors"
                                disabled={customerType === 'booking' && !!selectedBooking}
                            >
                                <option value="">No barber assigned</option>
                                {barbers.map(barber => (
                                    <option key={barber.id} value={barber.id}>{barber.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-glass p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Payment Method *</h3>
                            <div className="space-y-2">
                                {['cash', 'card', 'mobile'].map((method) => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method as any)}
                                        className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 ${paymentMethod === method
                                            ? 'bg-gold-gradient text-midnight font-bold'
                                            : 'bg-white/5 text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <CreditCard size={20} />
                                        <span className="capitalize">{method}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="bg-glass p-6 rounded-xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Summary</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between text-subtle-text">
                                    <span>Subtotal</span>
                                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-subtle-text">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="font-mono">${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-xl">
                                    <span>Total</span>
                                    <span className="text-gold font-mono">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleCreateTransaction}
                                disabled={isProcessing || !customerName || !customerPhone || services.length === 0}
                                className="w-full py-4 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Receipt size={20} />
                                        Generate Receipt & Complete
                                    </>
                                )}
                            </button>

                            <button
                                onClick={resetForm}
                                className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
                            >
                                Clear Form
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Selection Modal */}
            {showBookingModal && (
                <BookingQuickSelect
                    onSelect={handleBookingSelected}
                    onClose={() => setShowBookingModal(false)}
                />
            )}

            {/* Order Selection Modal */}
            {showOrderModal && (
                <OrderQuickSelect
                    onSelect={handleOrderSelected}
                    onClose={() => setShowOrderModal(false)}
                />
            )}
        </div>
    );
}
