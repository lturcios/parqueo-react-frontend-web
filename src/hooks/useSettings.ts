import { useState, useEffect } from 'react';

export interface AppSettings {
  allowWebEntry: boolean;
  refreshRate: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  allowWebEntry: true,
  refreshRate: 30,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('app_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return { settings, updateSettings };
}
