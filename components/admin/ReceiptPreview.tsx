import React from 'react';
import { Printer, X } from 'lucide-react';
import '../../styles/print.css';

interface ReceiptPreviewProps {
    transaction: unknown;
    onClose: () => void;
    onPrint: () => void;
}

export function ReceiptPreview({ transaction, onClose, onPrint }: ReceiptPreviewProps) {
    // Format date
    const receiptDate = new Date(transaction.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className="space-y-4">
            {/* Action Buttons - Hidden on print */}
            <div className="flex gap-3 no-print">
                <button
                    onClick={onPrint}
                    className="flex-1 py-3 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2"
                >
                    <Printer size={20} />
                    Print Receipt
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Receipt */}
            <div className="receipt-container bg-white text-black p-8 rounded-xl max-w-md mx-auto">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-6 mb-6">
                    <h1 className="text-3xl font-serif font-bold mb-2">LUXECUT</h1>
                    <p className="text-sm">BARBER SHOP</p>
                    <p className="text-xs mt-2">123 Main Street, Dubai, UAE</p>
                    <p className="text-xs">Phone: +971 50 123 4567</p>
                </div>

                {/* Receipt Info */}
                <div className="text-sm space-y-1 mb-6">
                    <div className="flex justify-between">
                        <span>Receipt #:</span>
                        <span className="font-mono font-bold">{transaction.receipt_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{receiptDate}</span>
                    </div>
                    {transaction.barber_name && (
                        <div className="flex justify-between">
                            <span>Barber:</span>
                            <span>{transaction.barber_name}</span>
                        </div>
                    )}
                </div>

                {/* Customer Details */}
                <div className="border-t border-black pt-4 mb-4">
                    <h3 className="font-bold mb-2">CUSTOMER DETAILS</h3>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                            <span>Name:</span>
                            <span>{transaction.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phone:</span>
                            <span>{transaction.customer_phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="capitalize">{transaction.customer_type}</span>
                        </div>
                    </div>
                </div>

                {/* Services */}
                <div className="border-t border-black pt-4 mb-4">
                    <h3 className="font-bold mb-3">SERVICES RENDERED</h3>
                    <div className="space-y-2">
                        {transaction.services.map((service: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="flex-1">{service.service_name}</span>
                                <span className="font-mono">${service.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="border-t-2 border-black pt-4 space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-mono">${transaction.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Tax ({transaction.tax_rate}%):</span>
                        <span className="font-mono">${transaction.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t-2 border-black pt-2">
                        <span>TOTAL:</span>
                        <span className="font-mono">${transaction.total_amount.toFixed(2)}</span>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4 pt-4 border-t border-black text-sm">
                    <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="capitalize font-bold">{transaction.payment_method}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t-2 border-dashed border-black text-center text-sm">
                    <p className="font-bold mb-2">Thank you for visiting!</p>
                    <p className="text-xs mb-1">Visit us again soon</p>
                    <p className="text-xs">www.luxecut.ae</p>
                </div>
            </div>
        </div>
    );
}
