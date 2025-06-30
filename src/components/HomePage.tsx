import React, { useMemo } from 'react';
import { Calendar, Clock, TrendingUp, Users, Shield, Sparkles, ChevronRight, CalendarDays, Zap, User, Calculator, Target, CheckCircle } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import { createDateFromString } from '../utils/dateUtils';

interface HomePageProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  calculatedPTO: number;
  currentPTOInputValue: string;
  setCurrentPTOInputValue: (value: string) => void;
  accrualRateInputValue: string;
  setAccrualRateInputValue: (value: string) => void;
  userSettings: UserSettings;
  onCurrentPTOBlur: () => void;
  onAccrualRateBlur: () => void;
  onGetStarted: () => void;
  hasCompletedOnboarding: boolean;
  formatSelectedDate: () => string;
  hoursToDays: (hours: number) => string;
  setCurrentPage: (page: string) => void;
}

export default function HomePage({
  selectedDate,
  setSelectedDate,
  calculatedPTO,
  currentPTOInputValue,
  setCurrentPTOInputValue,
  accrualRateInputValue,
  setAccrualRateInputValue,
  userSettings,
  onCurrentPTOBlur,
  onAccrualRateBlur,
  onGetStarted,
  hasCompletedOnboarding,
  formatSelectedDate,
  hoursToDays,
  setCurrentPage
}: HomePageProps) {
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

  const howItWorksSteps = [
    {
      step: "01",
      icon: User,
      title: "Set Up Your Profile",
      description: "Enter your current PTO balance, accrual rate, and pay schedule in just a few clicks."
    },
    {
      step: "02",
      icon: Calculator,
      title: "Calculate Future Balance",
      description: "Pick any future date and instantly see how much PTO you'll have available."
    },
    {
      step: "03",
      icon: Target,
      title: "Plan Your Vacations",
      description: "Use our calendar to schedule time off and see how it affects your balance."
    },
    {
      step: "04",
      icon: CheckCircle,
      title: "Enjoy Peace of Mind",
      description: "Never worry about PTO again with accurate tracking and smart planning."
    }
  ];

  // Helper function to format pay period for display
  const formatPayPeriod = (payPeriod: string) => {
    switch (payPeriod) {
      case 'weekly':
        return 'Weekly';
      case 'biweekly':
        return 'Bi-weekly';
      case 'semimonthly':
        return 'Semi-monthly';
      case 'monthly':
        return 'Monthly';
      default:
        return payPeriod;
    }
  };

  // Find the next upcoming vacation
  const nextVacation = useMemo(() => {
    const today = new Date();
    const upcomingVacations = userSettings.vacations
      .filter(vacation => createDateFromString(vacation.startDate) >= today)
      .sort((a, b) => createDateFromString(a.startDate).getTime() - createDateFromString(b.startDate).getTime());
    
    return upcomingVacations.length > 0 ? upcomingVacations[0] : null;
  }, [userSettings.vacations]);

  // Determine the main CTA action and content
  const handleMainCTA = () => {
    if (hasCompletedOnboarding) {
      setCurrentPage('calendar');
    } else {
      onGetStarted();
    }
  };

  const getMainCTAContent = () => {
    if (hasCompletedOnboarding) {
      return {
        text: 'View Your PTO Calendar',
        icon: CalendarDays
      };
    } else {
      return {
        text: 'Get Started - It\'s Free!',
        icon: User
      };
    }
  };

  const mainCTA = getMainCTAContent();

  // Format the next vacation start date
  const formatNextVacationDate = () => {
    if (!nextVacation) return '';
    const date = createDateFromString(nextVacation.startDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      {/* Hero Section with PTO Calculator */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-large border border-gray-100 dark:border-gray-700 p-6 sm:p-8 transition-all duration-300">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-medium">
                  <CalendarDays className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Your PTO Crystal Ball
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base">
                  See exactly how much time off you'll have on any future date
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Current PTO Balance (hours)
                    </label>
                    <input
                      type="number"
                      value={currentPTOInputValue}
                      onChange={(e) => setCurrentPTOInputValue(e.target.value)}
                      onBlur={onCurrentPTOBlur}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="Enter your current PTO in hours"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Equivalent to {hoursToDays(userSettings.currentPTO)} days (8 hours = 1 day)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Accrual Rate per Pay Period (hours)
                    </label>
                    <input
                      type="number"
                      value={accrualRateInputValue}
                      onChange={(e) => setAccrualRateInputValue(e.target.value)}
                      onBlur={onAccrualRateBlur}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="How many PTO hours you earn per pay period"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatPayPeriod(userSettings.payPeriod)} accrual rate.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Future Date
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

                <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-sm text-primary-700 dark:text-primary-300 font-semibold mb-2 uppercase tracking-wide">
                      {nextVacation ? `Your next vacation starts: ${formatNextVacationDate()}` : `On ${formatSelectedDate()}`}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 mb-2">
                      {calculatedPTO.toFixed(2)}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 font-semibold text-base mb-2">
                      hours of PTO available
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                  onClick={handleMainCTA}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-medium hover:shadow-large flex items-center justify-center mx-auto"
                >
                  {mainCTA.text}
                  <mainCTA.icon className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300 mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How PTOPal
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                works for you
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get started in minutes and take control of your time off planning with our intuitive process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Connection Line (hidden on last item) */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-600 z-0 transform translate-x-6"></div>
                )}
                
                <div className="relative bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-soft">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft mx-auto">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
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
                      {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-US', { 
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
    </>
  );
}