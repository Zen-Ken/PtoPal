import React, { useState, useEffect } from 'react';
import ProfilePage from './components/ProfilePage';
import CalendarPage from './components/CalendarPage';
import OnboardingPage from './components/OnboardingPage';
import HomePage from './components/HomePage';
import Navbar from './components/Navbar';
import BoltBadge from './components/BoltBadge';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAutomaticPTOAccrual } from './hooks/useAutomaticPTOAccrual';
import { useDarkMode } from './hooks/useDarkMode';
import { UserSettings, defaultUserSettings } from './types/UserSettings';
import { calculatePTOForTargetDate } from './utils/dateUtils';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState(''); // Start with empty string
  const [calculatedPTO, setCalculatedPTO] = useState(0);
  
  // Local input states for better UX
  const [currentPTOInputValue, setCurrentPTOInputValue] = useState('');
  const [accrualRateInputValue, setAccrualRateInputValue] = useState('');
  
  // Use localStorage for user settings
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('ptopal-settings', defaultUserSettings);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>('ptopal-onboarding-complete', false);

  // Initialize dark mode
  const { isDarkMode } = useDarkMode();

  // Use automatic PTO accrual hook
  useAutomaticPTOAccrual(userSettings, handleUpdateSettings);

  // Sync input values with userSettings
  useEffect(() => {
    setCurrentPTOInputValue(userSettings.currentPTO.toFixed(2));
  }, [userSettings.currentPTO]);

  useEffect(() => {
    setAccrualRateInputValue(userSettings.accrualRate.toFixed(2));
  }, [userSettings.accrualRate]);

  // Calculate PTO when selectedDate changes (only if date is provided)
  useEffect(() => {
    if (selectedDate) {
      calculatePTOForDate(selectedDate);
    } else {
      setCalculatedPTO(0); // Reset to 0 when no date is selected
    }
  }, [selectedDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod, userSettings.vacations]);

  const calculatePTOForDate = (dateString: string) => {
    const targetDate = new Date(dateString);
    const calculatedBalance = calculatePTOForTargetDate(
      userSettings.currentPTO,
      userSettings.accrualRate,
      userSettings.payPeriod,
      userSettings.vacations,
      targetDate
    );
    setCalculatedPTO(Math.round(calculatedBalance * 100) / 100); // Round to 2 decimal places
  };

  function handleUpdateSettings(newSettings: Partial<UserSettings>) {
    // Round numeric values to 2 decimal places
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
    
    // Update tracking fields when PTO balance changes manually
    if (typeof processedSettings.currentPTO === 'number' && processedSettings.currentPTO !== userSettings.currentPTO) {
      const today = new Date().toISOString().split('T')[0];
      processedSettings.lastKnownPTOBalance = processedSettings.currentPTO;
      processedSettings.lastAccrualUpdateDate = today;
    }
    
    setUserSettings(prev => ({ ...prev, ...processedSettings }));
  }

  const handleCurrentPTOBlur = () => {
    const numericValue = currentPTOInputValue === '' ? 0 : Number(currentPTOInputValue);
    const roundedValue = Math.round(numericValue * 100) / 100;
    handleUpdateSettings({ currentPTO: roundedValue });
  };

  const handleAccrualRateBlur = () => {
    const numericValue = accrualRateInputValue === '' ? 0 : Number(accrualRateInputValue);
    const roundedValue = Math.round(numericValue * 100) / 100;
    handleUpdateSettings({ accrualRate: roundedValue });
  };

  const handleOnboardingComplete = (settings: UserSettings) => {
    const today = new Date().toISOString().split('T')[0];
    const settingsWithTracking = {
      ...settings,
      lastKnownPTOBalance: settings.currentPTO,
      lastAccrualUpdateDate: today
    };
    setUserSettings(settingsWithTracking);
    setHasCompletedOnboarding(true);
    setCurrentPage('home');
  };

  const handleGetStarted = () => {
    if (hasCompletedOnboarding) {
      setCurrentPage('profile');
    } else {
      setCurrentPage('onboarding');
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number) => (hours / 8).toFixed(2);

  if (currentPage === 'onboarding') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <BoltBadge />
        <Navbar 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          hasCompletedOnboarding={hasCompletedOnboarding}
          onGetStarted={handleGetStarted}
        />
        <OnboardingPage 
          onComplete={handleOnboardingComplete}
          onBack={() => setCurrentPage('home')}
        />
      </div>
    );
  }

  if (currentPage === 'profile') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <BoltBadge />
        <Navbar 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          hasCompletedOnboarding={hasCompletedOnboarding}
          onGetStarted={handleGetStarted}
        />
        <ProfilePage 
          onBack={() => setCurrentPage('home')}
          userSettings={userSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      </div>
    );
  }

  if (currentPage === 'calendar') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <BoltBadge />
        <Navbar 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          hasCompletedOnboarding={hasCompletedOnboarding}
          onGetStarted={handleGetStarted}
        />
        <CalendarPage 
          onBack={() => setCurrentPage('home')}
          userSettings={userSettings}
          onUpdateSettings={handleUpdateSettings}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <BoltBadge />
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onGetStarted={handleGetStarted}
      />
      <HomePage 
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        calculatedPTO={calculatedPTO}
        currentPTOInputValue={currentPTOInputValue}
        setCurrentPTOInputValue={setCurrentPTOInputValue}
        accrualRateInputValue={accrualRateInputValue}
        setAccrualRateInputValue={setAccrualRateInputValue}
        userSettings={userSettings}
        onCurrentPTOBlur={handleCurrentPTOBlur}
        onAccrualRateBlur={handleAccrualRateBlur}
        onGetStarted={handleGetStarted}
        hasCompletedOnboarding={hasCompletedOnboarding}
        formatSelectedDate={formatSelectedDate}
        hoursToDays={hoursToDays}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}

export default App;