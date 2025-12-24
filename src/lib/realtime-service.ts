import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Centralized Realtime Service for managing Supabase subscriptions.
 * Provides a clean API for subscribing to table changes, presence, and notifications.
 */
class RealtimeService {
    private channels: Map<string, RealtimeChannel> = new Map();
    private subscribers: Map<string, Function[]> = new Map();

    /**
     * Subscribe to table changes (INSERT, UPDATE, DELETE, or all)
     */
    subscribeToTable<T = any>(
        table: string,
        event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
        callback: (payload: RealtimePostgresChangesPayload<T>) => void
    ): () => void {
        const key = `${table}:${event}`;

        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        this.subscribers.get(key)!.push(callback);

        // Create channel if it doesn't exist
        if (!this.channels.has(table)) {
            const channel = supabase
                .channel(`${table}-changes`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    (payload) => {
                        this.notifySubscribers(table, payload.eventType, payload);
                    }
                )
                .subscribe();

            this.channels.set(table, channel);
        }

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);

                if (callbacks.length === 0) {
                    this.subscribers.delete(key);
                    const hasOtherSubscribers = Array.from(this.subscribers.keys()).some((k) =>
                        k.startsWith(`${table}:`)
                    );
                    if (!hasOtherSubscribers) {
                        const channel = this.channels.get(table);
                        if (channel) {
                            supabase.removeChannel(channel);
                            this.channels.delete(table);
                        }
                    }
                }
            }
        };
    }

    private notifySubscribers(table: string, event: string, payload: any): void {
        const specificKey = `${table}:${event}`;
        const wildcardKey = `${table}:*`;

        [specificKey, wildcardKey].forEach((key) => {
            const callbacks = this.subscribers.get(key);
            if (callbacks) {
                callbacks.forEach((callback) => callback(payload));
            }
        });
    }

    /**
     * Subscribe to booking notifications for a specific user.
     */
    subscribeToBookingNotifications(userId: string, onNotification: (data: unknown) => void) {
        const channel = supabase
            .channel(`user-${userId}-notifications`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    onNotification(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Clean up all active subscriptions.
     */
    cleanup() {
        this.channels.forEach((channel) => {
            supabase.removeChannel(channel);
        });
        this.channels.clear();
        this.subscribers.clear();
    }
}

export const realtimeService = new RealtimeService();
