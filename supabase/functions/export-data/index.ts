import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { authenticateAdmin } from '../_shared/auth.ts';
import { withSafetyNet, SafetyContext } from '../_shared/safety-core.ts';
import { SafeValidator } from '../_shared/validation-suite.ts';
import { RateLimiter } from '../_shared/rate-limiter.ts';
import { withSecurityHeaders } from '../_shared/security-headers.ts';
import { MetricsCollector } from '../_shared/metrics.ts';

const jsonToCsv = (items: unknown[]) => {
    if (!items || items.length === 0) return '';
    const replacer = (_key: string, value: any) => value === null ? '' : value;
    const header = Object.keys(items[0]);
    const csv = [
        header.join(','), // header row
        ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');
    return csv;
};

// Create instances of our new utilities
const validator = new SafeValidator();
const rateLimiter = new RateLimiter();
const metrics = MetricsCollector.getInstance();

const handleExportRequest = async (req: Request, context: SafetyContext) => {
    const startTime = Date.now();
    
    try {
        // Rate limiting check
        const userId = context.userId || 'anonymous';
        const rateCheck = await rateLimiter.check(userId, 'user', context);
        if (!rateCheck.allowed) {
            return new Response(
                JSON.stringify({ error: 'Rate limit exceeded' }), 
                { 
                    status: 429, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }
        
        await authenticateAdmin(req);
        const requestData = await req.json();
        
        // Validate request data
        const validation = await validator.validate(requestData, 'export-request', context);
        if (!validation.success && context.config.enableValidation) {
            return new Response(
                JSON.stringify({ error: 'Invalid request data', details: validation.errors }), 
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }
        
        const { entity, format } = requestData;

        if (format !== 'csv') {
            throw new Error('Only CSV export is currently supported by the backend.');
        }

        let data: Record<string, unknown>[] = [];
        let filename = 'export.csv';

        if (entity === 'bookings') {
            // Get all bookings first
            const { data: bookings, error: bookingsError } = await supabaseAdmin
                .from('bookings')
                .select('*');
            
            if (bookingsError) throw bookingsError;
            
            // Process bookings to include readable names by fetching related data
            const processedBookings = await Promise.all(bookings.map(async (booking) => {
                // Get user name from app_users table using the user_id
                let userName = booking.userName || 'N/A';
                if (booking.user_id) {
                    const { data: userData, error: userError } = await supabaseAdmin
                        .from('app_users')
                        .select('name')
                        .eq('id', booking.user_id)
                        .single();
                    
                    if (!userError && userData) {
                        userName = userData.name;
                    }
                }
                
                // Get barber name from barbers table using the barber_id
                let barberName = 'N/A';
                if (booking.barber_id) {
                    const { data: barberData, error: barberError } = await supabaseAdmin
                        .from('barbers')
                        .select('name')
                        .eq('id', booking.barber_id)
                        .single();
                    
                    if (!barberError && barberData) {
                        barberName = barberData.name;
                    }
                }
                
                // Get service names from services table using service_ids
                let serviceNames: string[] = [];
                if (booking.service_ids && booking.service_ids.length > 0) {
                    const { data: services, error: servicesError } = await supabaseAdmin
                        .from('services')
                        .select('name')
                        .in('id', booking.service_ids);
                    
                    if (!servicesError && services) {
                        serviceNames = services.map(s => s.name);
                    }
                }
                
                // Return enhanced booking with names instead of just IDs
                // COMPLIANCE: Removing personal identifying information per privacy requirements
                return {
                    id: booking.id,
                    user_id: booking.user_id,
                    barber_id: booking.barber_id,
                    service_ids: booking.service_ids,
                    appointment_date: booking.appointment_date,
                    time_slot: booking.time_slot,
                    status: booking.status,
                    notes: booking.notes,
                    created_at: booking.created_at,
                    updated_at: booking.updated_at
                    // REMOVED: user_name, barber_name, service_names (personal identifying information)
                };
            }));
            
            data = processedBookings || [];
            filename = 'bookings_export.csv';
        } else if (entity === 'orders') {
            // Get all orders first
            const { data: orders, error: ordersError } = await supabaseAdmin
                .from('product_orders')
                .select('*');
            
            if (ordersError) throw ordersError;
            
            // Process orders to include readable names
            const processedOrders = await Promise.all(orders.map(async (order) => {
                // Get user name from app_users table using the user_id
                let userName = order.userName || 'N/A';
                if (order.user_id) {
                    const { data: userData, error: userError } = await supabaseAdmin
                        .from('app_users')
                        .select('name')
                        .eq('id', order.user_id)
                        .single();
                    
                    if (!userError && userData) {
                        userName = userData.name;
                    }
                } else if (order.username) {
                    // Fallback to username field if user_id is not available
                    userName = order.username;
                }
                
                // Get product name from products table using the product_id
                let productName = 'N/A';
                if (order.product_id) {
                    const { data: productData, error: productError } = await supabaseAdmin
                        .from('products')
                        .select('name')
                        .eq('id', order.product_id)
                        .single();
                    
                    if (!productError && productData) {
                        productName = productData.name;
                    }
                }
                
                // Return enhanced order with names instead of just IDs
                // COMPLIANCE: Removing personal identifying information per privacy requirements
                return {
                    id: order.id,
                    user_id: order.user_id,
                    product_id: order.product_id,
                    quantity: order.quantity,
                    total_price: order.total_price,
                    status: order.status,
                    created_at: order.created_at,
                    updated_at: order.updated_at
                    // REMOVED: user_name, product_name (personal identifying information)
                };
            }));
            
            data = processedOrders || [];
            filename = 'orders_export.csv';
        } else if (entity === 'users') {
            const { data: users, error } = await supabaseAdmin.from('app_users').select('*');
            if (error) throw error;
            
            data = users || [];
            filename = 'users_export.csv';
        }

        const csvContent = jsonToCsv(data);

        // Record successful request metric
        await metrics.recordRequest('export-data', Date.now() - startTime, 200, userId);

        const response = new Response(JSON.stringify({
            csv: csvContent,
            filename
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

        return withSecurityHeaders(response);

    } catch (error) {
        // Record error metric
        await metrics.recordRequest('export-data', Date.now() - startTime, 500, context.userId);
        
        const response = new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
        
        return withSecurityHeaders(response);
    }
};

serve(withSafetyNet(handleExportRequest));