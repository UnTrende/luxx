// ============================================================================
// Shared Response Utilities for Edge Functions
// ============================================================================
// Provides consistent response patterns across all edge functions
// ============================================================================

import { corsHeaders } from './cors.ts';
import { logger } from '../../../src/lib/logger';

/**
 * Create a successful JSON response with proper CORS headers
 * @param data - The data to return in the response body
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(data: T, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

/**
 * Create an error response with proper CORS headers
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 */
export function errorResponse(message: string, status: number = 400): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

/**
 * Create a response for CORS preflight requests
 */
export function corsPreflightResponse(): Response {
    return new Response('ok', { headers: corsHeaders });
}

/**
 * Standard error handler - logs error and returns appropriate response
 * @param error - The error to handle
 * @param context - Optional context for logging
 */
export function handleError(error: Error | unknown, context?: string): Response {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (context) {
        logger.error(`[${context}] Error:`, errorMessage, 'response');
    } else {
        logger.error('Error:', errorMessage, 'response');
    }

    // Handle specific error types
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('Unauthorized')) {
        return errorResponse(errorMessage, 401);
    }
    if (errorMessage.includes('not found')) {
        return errorResponse(errorMessage, 404);
    }
    if (errorMessage.includes('required')) {
        return errorResponse(errorMessage, 400);
    }

    return errorResponse(errorMessage, 500);
}

// ============================================================================
// Database Column Name Mappings
// ============================================================================
// Maps between JavaScript camelCase and database snake_case/lowercase

/**
 * Map JavaScript booking properties to database column names
 * Database uses lowercase: timeslot, totalprice, reviewleft, username
 */
export const BOOKING_DB_COLUMNS = {
    // JavaScript → Database
    userId: 'user_id',
    userName: 'username',
    barberId: 'barber_id',
    serviceIds: 'service_ids',
    timeSlot: 'timeslot',
    totalPrice: 'totalprice',
    reviewLeft: 'reviewleft',
    cancelMessage: 'cancelmessage',
    createdAt: 'created_at'
} as const;

/**
 * Map JavaScript product properties to database column names
 */
export const PRODUCT_DB_COLUMNS = {
    imageUrl: 'imageurl',
    imagePath: 'image_path',
    storageBucket: 'storage_bucket'
} as const;

/**
 * Transform a booking from database format to JavaScript format
 */
export function mapBookingFromDb(dbBooking: Record<string, any>): Record<string, any> {
    return {
        id: dbBooking.id,
        userId: dbBooking.user_id,
        userName: dbBooking.username,
        barberId: dbBooking.barber_id,
        serviceIds: dbBooking.service_ids,
        date: dbBooking.date,
        timeSlot: dbBooking.timeslot,
        totalPrice: dbBooking.totalprice,
        status: dbBooking.status,
        reviewLeft: dbBooking.reviewleft,
        cancelMessage: dbBooking.cancelmessage,
        createdAt: dbBooking.created_at,
        // Include nested relations if present
        barbers: dbBooking.barbers,
        services: dbBooking.services
    };
}

/**
 * Transform a product from database format to JavaScript format
 */
export function mapProductFromDb(dbProduct: Record<string, any>): Record<string, any> {
    return {
        id: dbProduct.id,
        name: dbProduct.name,
        description: dbProduct.description,
        categories: Array.isArray(dbProduct.categories) ? dbProduct.categories : [],
        price: Number(dbProduct.price) || 0,
        imageUrl: dbProduct.imageurl || dbProduct.image_url || '',
        imagePath: dbProduct.image_path || '',
        stock: Number(dbProduct.stock) || 0,
        storageBucket: dbProduct.storage_bucket || 'product-images'
    };
}
