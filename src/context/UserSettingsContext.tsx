'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAutomaticPTOAccrual } from '../hooks/useAutomaticPTOAccrual';
import { UserSettings, defaultUserSettings } from '../types/UserSettings';

interface UserSettingsContextValue {
  userSettings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: (settings: UserSettings) => void;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('ptopal-settings', defaultUserSettings);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>('ptopal-onboarding-complete', false);

  function updateSettings(newSettings: Partial<UserSettings>) {
    const processedSettings = { ...newSettings };
    if (typeof processedSettings.currentPTO === 'number') {
      processedSettings.currentPTO = Math.round(processedSettings.currentPTO * 100) / 100;
    }
    if (typeof processedSettings.accrualRate === 'number') {
      processedSettings.accrualRate = Math.round(processedSettings.accrualRate * 100) / 100;
    }
    if (typeof processedSettings.annualAllowance === 'number') {
      processedSettings.annualAllowance = Math.round(processedSettings.annualAllowance * 100) / 100;
    }

    if (typeof processedSettings.currentPTO === 'number' && processedSettings.currentPTO !== userSettings.currentPTO) {
      const today = new Date().toISOString().split('T')[0];
      processedSettings.lastKnownPTOBalance = processedSettings.currentPTO;
      processedSettings.lastAccrualUpdateDate = today;
    }

    setUserSettings(prev => ({ ...prev, ...processedSettings }));
  }

  function completeOnboarding(settings: UserSettings) {
    const today = new Date().toISOString().split('T')[0];
    setUserSettings({
      ...settings,
      lastKnownPTOBalance: settings.currentPTO,
      lastAccrualUpdateDate: today,
    });
    setHasCompletedOnboarding(true);
  }

  useAutomaticPTOAccrual(userSettings, updateSettings);

  return (
    <UserSettingsContext.Provider value={{ userSettings, updateSettings, hasCompletedOnboarding, completeOnboarding }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider');
  return ctx;
}
