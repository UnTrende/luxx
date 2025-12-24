import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function checkRateLimit(
    req: Request,
    supabaseClient: any, // Pass the client to avoid re-creating if possible, or create new
    limit: number = 100,
    windowSeconds: number = 60
): Promise<boolean> {
    try {
        // 1. Identify the caller (IP address or User ID)
        const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';

        // You could also use User ID if authenticated:
        // const { data: { user } } = await supabaseClient.auth.getUser();
        // const key = user ? `user:${user.id}` : `ip:${ip}`;

        const key = `ip:${ip}`;

        // 2. Call the RPC function
        const { data: isAllowed, error } = await supabaseClient.rpc('check_rate_limit', {
            rate_key: key,
            max_points: limit,
            window_duration_seconds: windowSeconds
        });

        if (error) {
            logger.error('Rate limit check failed:', error, 'rateLimit');
            // Fail open (allow request) if DB check fails to avoid blocking users due to system error
            // Or fail closed depending on security posture. Failing open is usually safer for UX.
            return true;
        }

        return isAllowed;
    } catch (err) {
        logger.error('Unexpected error in checkRateLimit:', err, 'rateLimit');
        return true; // Fail open
    }
}
