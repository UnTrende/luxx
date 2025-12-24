import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import { AppNotification } from '../types';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../src/lib/logger';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) {
        setNotifications([]);
        setIsLoading(false);
        return;
    }
    
    let channel: RealtimeChannel | null = null;
    
    const setupNotifications = async () => {
      setIsLoading(true);
      try {
        const initialNotifications = await api.notifications.getNotifications();
        setNotifications(initialNotifications);
      } catch (error) {
        logger.error("Failed to fetch initial notifications", error, 'NotificationContext');
      } finally {
        setIsLoading(false);
      }
      
      // Setup real-time subscription
      channel = api.notifications.subscribeToNotifications(user.id, (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
      });
    };
    
    setupNotifications();
    
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const originalNotifications = notifications;
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    try {
        await api.notifications.markNotificationAsRead(notificationId);
    } catch (error) {
        logger.error("Failed to mark notification as read", error, 'NotificationContext');
        // Revert UI change on failure
        setNotifications(originalNotifications);
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
