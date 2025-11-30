import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { api } from '../services/api';

interface SiteSettings {
  shop_name?: string;
  allow_signups?: boolean;
  site_logo?: string;
  hero_images?: string[];
  [key: string]: any;
}

interface SettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getSettings();
        
        // Handle both direct settings and wrapped response
        const settingsData = response.success && response.data ? response.data : response;
        setSettings(settingsData);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Failed to load site settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const value = {
    settings,
    isLoading,
    error
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};