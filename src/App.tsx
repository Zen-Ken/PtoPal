import React, { useState, useEffect } from 'react';
import { Menu, X, Calendar, Clock, TrendingUp, Users, Shield, Sparkles, ChevronRight, CalendarDays, Zap, User } from 'lucide-react';
import ProfilePage from './components/ProfilePage';
import CalendarPage from './components/CalendarPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserSettings, defaultUserSettings } from './types/UserSettings';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState('');
  const [calculatedPTO, setCalculatedPTO] = useState(0);
  
  // Use localStorage for user settings
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('ptopal-settings', defaultUserSettings);

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
  }, [selectedDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod]);

  const calculatePTOForDate = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    
    // If the target date is in the past or today, return current PTO
    if (targetDate <= today) {
      setCalculatedPTO(userSettings.currentPTO);
      return;
    }

    // Calculate how many pay periods will occur between now and the target date
    const payPeriodOptions = {
      weekly: 7,
      biweekly: 14,
      semimonthly: 15, // Approximate
      monthly: 30 // Approximate
    };

    let payPeriodsCount = 0;
    
    if (userSettings.payPeriod === 'semimonthly') {
      // For semi-monthly, count 1st and 15th of each month
      const currentDate = new Date(today);
      currentDate.setDate(1); // Start from first of current month
      
      while (currentDate <= targetDate) {
        // Check if 1st of month is between now and target
        if (currentDate >= today && currentDate <= targetDate) {
          payPeriodsCount++;
        }
        
        // Check if 15th of month is between now and target
        const fifteenth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
        if (fifteenth >= today && fifteenth <= targetDate) {
          payPeriodsCount++;
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else {
      // For other pay periods, calculate based on interval
      const intervalDays = payPeriodOptions[userSettings.payPeriod as keyof typeof payPeriodOptions] || 30;
      const daysDifference = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      payPeriodsCount = Math.floor(daysDifference / intervalDays);
    }

    const additionalPTO = payPeriodsCount * userSettings.accrualRate;
    setCalculatedPTO(userSettings.currentPTO + additionalPTO);
  };

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
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
  const hoursToDays = (hours: number) => (hours / 8).toFixed(1);

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PTOPal
                </span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a href="#" className="text-slate-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                    Home
                  </a>
                  <button 
                    onClick={() => setCurrentPage('calendar')}
                    className="text-slate-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Calendar
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className="text-slate-500 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
                  Get Started
                  <Sparkles className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2 rounded-md"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md border-t border-slate-200/50">
              <a href="#" className="text-slate-900 block px-3 py-2 text-base font-medium">Home</a>
              <button 
                onClick={() => {
                  setCurrentPage('calendar');
                  setIsMenuOpen(false);
                }}
                className="text-slate-500 hover:text-slate-900 block px-3 py-2 text-base font-medium w-full text-left"
              >
                Calendar
              </button>
              <div className="pt-4 pb-3 border-t border-slate-200">
                <div className="flex items-center px-3 space-y-2">
                  <button 
                    onClick={() => {
                      setCurrentPage('profile');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left text-slate-500 hover:text-slate-900 block px-0 py-2 text-base font-medium flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-base font-medium transition-all duration-200">
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with PTO Calculator */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Your Personal PTO Assistant
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
              Never lose track of your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                time off again
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed">
              Plan your perfect vacation with confidence. PTOPal calculates your future PTO balance, 
              tracks accruals, and helps you make the most of your well-deserved time off.
            </p>
          </div>

          {/* PTO Calculator Card */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-12 relative overflow-hidden">
              {/* Card decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
              
              <div className="relative">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CalendarDays className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                    Your PTO Crystal Ball
                  </h2>
                  <p className="text-slate-600 text-lg">
                    See exactly how much time off you'll have on any future date
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Current PTO Balance (hours)
                      </label>
                      <input
                        type="number"
                        value={userSettings.currentPTO}
                        onChange={(e) => handleUpdateSettings({ currentPTO: Number(e.target.value) })}
                        className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-white/50 backdrop-blur-sm transition-all duration-200"
                        min="0"
                        step="0.5"
                        placeholder="Enter your current PTO in hours"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Equivalent to {hoursToDays(userSettings.currentPTO)} days (8 hours = 1 day)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Accrual Rate per Pay Period (hours)
                      </label>
                      <input
                        type="number"
                        value={userSettings.accrualRate}
                        onChange={(e) => handleUpdateSettings({ accrualRate: Number(e.target.value) })}
                        className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-white/50 backdrop-blur-sm transition-all duration-200"
                        min="0"
                        step="0.1"
                        placeholder="How many PTO hours you earn per pay period"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Equivalent to {hoursToDays(userSettings.accrualRate)} days per pay period
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Select Target Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-5 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-white/50 backdrop-blur-sm transition-all duration-200"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"></div>
                    <div className="relative text-center">
                      <div className="text-sm text-blue-700 font-semibold mb-3 uppercase tracking-wide">
                        On {formatSelectedDate()}
                      </div>
                      <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                        {calculatedPTO.toFixed(1)}
                      </div>
                      <div className="text-slate-700 font-semibold text-base mb-2">
                        hours of PTO available
                      </div>
                      <div className="text-sm text-slate-600 mb-4">
                        ({hoursToDays(calculatedPTO)} days)
                      </div>
                      {calculatedPTO > userSettings.currentPTO && (
                        <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +{(calculatedPTO - userSettings.currentPTO).toFixed(1)} hours from accrual
                        </div>
                      )}
                      {calculatedPTO === userSettings.currentPTO && selectedDate && (
                        <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4 mr-1" />
                          Current balance
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setCurrentPage('profile')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
                  >
                    Customize Your Settings
                    <User className="ml-3 w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">
                  {stat.number}
                </div>
                <div className="mt-2 text-sm font-medium text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Everything you need for
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                perfect PTO planning
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Discover the tools that make PTOPal the ultimate companion for managing your time off.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-blue-200/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl group-hover:from-blue-400/20 group-hover:to-purple-400/20 transition-all duration-300"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-6">
                <Clock className="w-4 h-4 mr-2" />
                Work-Life Balance
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
                Take control of your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  time off strategy
                </span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Stop letting PTO expire or missing out on well-deserved breaks. 
                PTOPal empowers you with intelligent insights to maximize your time off 
                and maintain the perfect work-life balance.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-slate-700 font-medium">Automatic accrual calculations with precision</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-slate-700 font-medium">Smart vacation planning recommendations</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-slate-700 font-medium">Expiration alerts and reminders</span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentPage('calendar')}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center group"
              >
                View PTO Calendar
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"></div>
                
                <div className="relative space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        <span className="font-semibold text-slate-900">Current Balance</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                          {userSettings.currentPTO} hrs
                        </div>
                        <div className="text-sm text-slate-600">
                          ({hoursToDays(userSettings.currentPTO)} days)
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                        style={{width: `${Math.min((userSettings.currentPTO / userSettings.annualAllowance) * 100, 100)}%`}}
                      ></div>
                    </div>
                    <div className="text-sm text-slate-600 mt-2">
                      {Math.round((userSettings.currentPTO / userSettings.annualAllowance) * 100)}% of annual allowance
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                        <span className="font-semibold text-slate-900">Next Accrual</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-600">+{userSettings.accrualRate} hrs</div>
                        <div className="text-sm text-slate-600">
                          (+{hoursToDays(userSettings.accrualRate)} days)
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
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
      <footer className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PTOPal
                </span>
              </div>
              <p className="text-slate-400 mb-8 max-w-md leading-relaxed">
                Your intelligent companion for managing time off. Never lose track of your 
                PTO balance and plan the perfect vacation with confidence and precision.
              </p>
              <div className="flex space-x-4">
                <button className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors group">
                  <Users className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </button>
                <button className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors group">
                  <Shield className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Product</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm">
                © 2024 PTOPal. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;