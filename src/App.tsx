import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar, Clock, TrendingUp, Users, Shield, Sparkles, ChevronRight, CalendarDays, Zap, User } from 'lucide-react';
import ProfilePage from './components/ProfilePage';
import CalendarPage from './components/CalendarPage';
import OnboardingPage from './components/OnboardingPage';
import BoltBadge from './components/BoltBadge';
import ThemeToggle from './components/ThemeToggle';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDarkMode } from './hooks/useDarkMode';
import { UserSettings, defaultUserSettings } from './types/UserSettings';
import { calculatePTOForTargetDate } from './utils/dateUtils';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState('');
  const [calculatedPTO, setCalculatedPTO] = useState(0);
  
  // Local input states for better UX
  const [currentPTOInputValue, setCurrentPTOInputValue] = useState('');
  const [accrualRateInputValue, setAccrualRateInputValue] = useState('');
  
  // Use localStorage for user settings
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('ptopal-settings', defaultUserSettings);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>('ptopal-onboarding-complete', false);

  // Initialize dark mode
  const { isDarkMode } = useDarkMode();

  // Sync input values with userSettings
  useEffect(() => {
    setCurrentPTOInputValue(userSettings.currentPTO.toFixed(2));
  }, [userSettings.currentPTO]);

  useEffect(() => {
    setAccrualRateInputValue(userSettings.accrualRate.toFixed(2));
  }, [userSettings.accrualRate]);

  useEffect(() => {
    // Calculate date 3 months from now as default
    const today = new Date();
    const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    const defaultDate = threeMonthsFromNow.toISOString().split('T')[0];
    setSelectedDate(defaultDate);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      calculatePTOForDate(selectedDate);
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

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
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
    
    setUserSettings(prev => ({ ...prev, ...processedSettings }));
  };

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
    setUserSettings(settings);
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

  const features = [
    {
      icon: Zap,
      title: "Instant Calculations",
      description: "Get real-time PTO projections with our lightning-fast calculator engine."
    },
    {
      icon: TrendingUp,
      title: "Smart Forecasting",
      description: "Predict your PTO balance months ahead to plan the perfect getaway."
    },
    {
      icon: Calendar,
      title: "Vacation Planner",
      description: "Visualize your time off and optimize your work-life balance."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your PTO data stays secure with enterprise-grade encryption."
    }
  ];

  const stats = [
    { number: "10K+", label: "Happy Users" },
    { number: "99.9%", label: "Accuracy" },
    { number: "24/7", label: "Available" },
    { number: "0", label: "Hassle" }
  ];

  if (currentPage === 'onboarding') {
    return (
      <OnboardingPage 
        onComplete={handleOnboardingComplete}
        onBack={() => setCurrentPage('home')}
      />
    );
  }

  if (currentPage === 'profile') {
    return (
      <ProfilePage 
        onBack={() => setCurrentPage('home')}
        userSettings={userSettings}
        onUpdateSettings={handleUpdateSettings}
      />
    );
  }

  if (currentPage === 'calendar') {
    return (
      <CalendarPage 
        onBack={() => setCurrentPage('home')}
        userSettings={userSettings}
        onUpdateSettings={handleUpdateSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Bolt Badge */}
      <BoltBadge />

      {/* Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                  PTOPal
                </span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a href="#" className="text-gray-900 dark:text-white font-medium px-3 py-2 text-sm transition-colors">
                    Home
                  </a>
                  <button 
                    onClick={() => setCurrentPage('calendar')}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium px-3 py-2 text-sm transition-colors"
                  >
                    Calendar
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium px-3 py-2 text-sm transition-colors flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center"
                >
                  {hasCompletedOnboarding ? 'Dashboard' : 'Get Started'}
                  <Sparkles className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
              <a href="#" className="text-gray-900 dark:text-white block px-3 py-2 text-base font-medium">Home</a>
              <button 
                onClick={() => {
                  setCurrentPage('calendar');
                  setIsMenuOpen(false);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block px-3 py-2 text-base font-medium w-full text-left transition-colors"
              >
                Calendar
              </button>
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center px-3 space-y-2">
                  <button 
                    onClick={() => {
                      setCurrentPage('profile');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block px-0 py-2 text-base font-medium flex items-center space-x-2 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-base font-medium transition-all duration-200"
                  >
                    {hasCompletedOnboarding ? 'Dashboard' : 'Get Started'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with PTO Calculator */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300 mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Your Personal PTO Assistant
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Never lose track of your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                time off again
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Plan your perfect vacation with confidence. PTOPal calculates your future PTO balance, 
              tracks accruals, and helps you make the most of your well-deserved time off.
            </p>
          </div>

          {/* PTO Calculator Card */}
          <div className="max-w-5xl mx-auto animate-slide-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-large border border-gray-100 dark:border-gray-700 p-8 sm:p-12 transition-all duration-300">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-medium">
                  <CalendarDays className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Your PTO Crystal Ball
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  See exactly how much time off you'll have on any future date
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Current PTO Balance (hours)
                    </label>
                    <input
                      type="number"
                      value={currentPTOInputValue}
                      onChange={(e) => setCurrentPTOInputValue(e.target.value)}
                      onBlur={handleCurrentPTOBlur}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="Enter your current PTO in hours"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Equivalent to {hoursToDays(userSettings.currentPTO)} days (8 hours = 1 day)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Accrual Rate per Pay Period (hours)
                    </label>
                    <input
                      type="number"
                      value={accrualRateInputValue}
                      onChange={(e) => setAccrualRateInputValue(e.target.value)}
                      onBlur={handleAccrualRateBlur}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="How many PTO hours you earn per pay period"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Equivalent to {hoursToDays(userSettings.accrualRate)} days per pay period
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Select Target Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-sm text-primary-700 dark:text-primary-300 font-semibold mb-3 uppercase tracking-wide">
                      On {formatSelectedDate()}
                    </div>
                    <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 mb-2">
                      {calculatedPTO.toFixed(2)}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 font-semibold text-base mb-2">
                      hours of PTO available
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      ({hoursToDays(calculatedPTO)} days)
                    </div>
                    {calculatedPTO > userSettings.currentPTO && (
                      <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{(calculatedPTO - userSettings.currentPTO).toFixed(2)} hours from accrual
                      </div>
                    )}
                    {calculatedPTO === userSettings.currentPTO && selectedDate && (
                      <div className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4 mr-1" />
                        Current balance
                      </div>
                    )}
                    {calculatedPTO < userSettings.currentPTO && (
                      <div className="inline-flex items-center px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                        <Calendar className="w-4 h-4 mr-1" />
                        After planned vacations
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button 
                  onClick={handleGetStarted}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-medium hover:shadow-large flex items-center justify-center mx-auto"
                >
                  {hasCompletedOnboarding ? 'Go to Dashboard' : 'Get Started - It\'s Free!'}
                  <User className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-300">
                  {stat.number}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300 mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything you need for
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                perfect PTO planning
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the tools that make PTOPal the ultimate companion for managing your time off.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300 mb-6">
                <Clock className="w-4 h-4 mr-2" />
                Work-Life Balance
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Take control of your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                  time off strategy
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Stop letting PTO expire or missing out on well-deserved breaks. 
                PTOPal empowers you with intelligent insights to maximize your time off 
                and maintain the perfect work-life balance.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Automatic accrual calculations with precision</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Smart vacation planning recommendations</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Expiration alerts and reminders</span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentPage('calendar')}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold flex items-center group transition-colors duration-300"
              >
                View PTO Calendar
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-large border border-gray-100 dark:border-gray-700">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">Current Balance</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                          {userSettings.currentPTO.toFixed(2)} hrs
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ({hoursToDays(userSettings.currentPTO)} days)
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500" 
                        style={{width: `${Math.min((userSettings.currentPTO / userSettings.annualAllowance) * 100, 100)}%`}}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {Math.round((userSettings.currentPTO / userSettings.annualAllowance) * 100)}% of annual allowance
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">Next Accrual</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{userSettings.accrualRate.toFixed(2)} hrs</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          (+{hoursToDays(userSettings.accrualRate)} days)
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold">
                  PTOPal
                </span>
              </div>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                Your intelligent companion for managing time off. Never lose track of your 
                PTO balance and plan the perfect vacation with confidence and precision.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors group">
                  <Users className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors group">
                  <Shield className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">Product</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <p className="text-gray-400 text-sm">
                © 2024 PTOPal. All rights reserved.
              </p>
              <p className="text-xs text-gray-500">
                Created for World's Largest Hackathon 2024
              </p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;