import React, { useState, useEffect } from 'react';
import { Plus, X, Edit } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import { logger } from '../../src/lib/logger';

interface ServiceItem {
    service_id?: string;
    service_name: string;
    price: number;
}

interface ServiceSelectorProps {
    services: ServiceItem[];
    onServicesChange: (services: ServiceItem[]) => void;
}

export function ServiceSelector({ services, onServicesChange }: ServiceSelectorProps) {
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualServiceName, setManualServiceName] = useState('');
    const [manualServicePrice, setManualServicePrice] = useState('');

    // Fetch available services
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const servicesData = await api.getServices();
                setAvailableServices(servicesData);
            } catch (error) {
                logger.error('Error fetching services:', error, 'ServiceSelector');
            }
        };
        fetchServices();
    }, []);

    // Add service from dropdown
    const handleAddService = (serviceId: string) => {
        const service = availableServices.find(s => s.id === serviceId);
        if (!service) return;

        const newService: ServiceItem = {
            service_id: service.id,
            service_name: service.name,
            price: service.price
        };

        onServicesChange([...services, newService]);
    };

    // Add manual service
    const handleAddManualService = () => {
        if (!manualServiceName || !manualServicePrice) {
            toast.error('Please enter service name and price');
            return;
        }

        const price = parseFloat(manualServicePrice);
        if (isNaN(price) || price <= 0) {
            toast.error('Please enter a valid price');
            return;
        }

        const newService: ServiceItem = {
            service_name: manualServiceName,
            price
        };

        onServicesChange([...services, newService]);
        setManualServiceName('');
        setManualServicePrice('');
        setShowManualEntry(false);
        toast.success('Service added');
    };

    // Remove service
    const handleRemoveService = (index: number) => {
        const newServices = services.filter((_, i) => i !== index);
        onServicesChange(newServices);
    };

    return (
        <div className="space-y-4">
            {/* Selected Services List */}
            {services.length > 0 && (
                <div className="space-y-2">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl"
                        >
                            <div className="flex-1">
                                <div className="text-white font-medium">{service.service_name}</div>
                                {!service.service_id && (
                                    <div className="text-xs text-gold">Manual Entry</div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-white font-mono">${service.price.toFixed(2)}</div>
                                <button
                                    onClick={() => handleRemoveService(index)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <X size={16} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Service Buttons */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAddService(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold transition-colors"
                    >
                        <option value="">+ Add from list</option>
                        {availableServices.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} - ${service.price}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="px-4 py-3 bg-gold-gradient text-midnight font-bold rounded-xl hover:shadow-glow transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    {showManualEntry ? <X size={20} /> : <Plus size={20} />}
                    Manual
                </button>
            </div>

            {/* Manual Entry Form */}
            {showManualEntry && (
                <div className="p-4 bg-white/5 border border-gold/30 rounded-xl space-y-3 animate-fade-in">
                    <div>
                        <label className="block text-sm text-subtle-text mb-2">Item Name</label>
                        <input
                            type="text"
                            value={manualServiceName}
                            onChange={(e) => setManualServiceName(e.target.value)}
                            placeholder="e.g., Hair Color, Product Name"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-subtle-text mb-2">Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={manualServicePrice}
                            onChange={(e) => setManualServicePrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleAddManualService}
                        className="w-full py-2 bg-gold text-midnight font-bold rounded-lg hover:bg-gold/90 transition-colors"
                    >
                        Add Item
                    </button>
                </div>
            )}

            {services.length === 0 && !showManualEntry && (
                <div className="text-center py-8 text-subtle-text">
                    <Plus size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No services added yet</p>
                </div>
            )}
        </div>
    );
}
