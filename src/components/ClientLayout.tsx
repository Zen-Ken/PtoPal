'use client';

import React from 'react';
import Navbar from './Navbar';
import { useDarkMode } from '../hooks/useDarkMode';
import { UserSettingsProvider } from '../context/UserSettingsContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useDarkMode();

  return (
    <UserSettingsProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Navbar />
        {children}
      </div>
    </UserSettingsProvider>
  );
}
