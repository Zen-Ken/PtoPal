import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Briefcase, CheckCircle, Sparkles, User, Building } from 'lucide-react';
import BoltBadge from './BoltBadge';
import ThemeToggle from './ThemeToggle';
import { UserSettings, defaultUserSettings } from '../types/UserSettings';

interface OnboardingPageProps {
  onComplete: (settings: UserSettings) => void;
  onBack: () => void;
}

export default function OnboardingPage({ onComplete, onBack }: OnboardingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState<UserSettings>(defaultUserSettings);
  
  // Local input states for better UX
  const [currentPTOInputValue, setCurrentPTOInputValue] = useState(defaultUserSettings.currentPTO.toFixed(2));
  const [accrualRateInputValue, setAccrualRateInputValue] = useState(defaultUserSettings.accrualRate.toFixed(2));
  const [annualAllowanceInputValue, setAnnualAllowanceInputValue] = useState(defaultUserSettings.annualAllowance.toFixed(2));

  const handleCurrentPTOBlur = () => {
    const numericValue = currentPTOInputValue === '' ? 0 : Number(currentPTOInputValue);
    const roundedValue = Math.round(numericValue * 100) / 100;
    setFormData(prev => ({ ...prev, currentPTO: roundedValue }));
  };

  const handleAccrualRateBlur = () => {
    const numericValue = accrualRateInputValue === '' ? 0 : Number(accrualRateInputValue);
    const roundedValue = Math.round(numericValue * 100) / 100;
    setFormData(prev => ({ ...prev, accrualRate: roundedValue }));
  };

  const handleAnnualAllowanceBlur = () => {
    const numericValue = annualAllowanceInputValue === '' ? 0 : Number(annualAllowanceInputValue);
    const roundedValue = Math.round(numericValue * 100) / 100;
    setFormData(prev => ({ ...prev, annualAllowance: roundedValue }));
  };

  const slides = [
    {
      id: 'welcome',
      title: 'Do you ever ask yourself...',
      subtitle: 'If you have enough PTO for your vacation?',
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-full flex items-center justify-center mb-8">
            <Calendar className="w-16 h-16 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="space-y-4">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Planning time off shouldn't be stressful or confusing.
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              PTOPal is the tool you need to take control of your vacation planning.
            </p>
          </div>
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-6 rounded-xl border border-primary-200/50 dark:border-primary-700/50">
            <p className="text-primary-700 dark:text-primary-300 font-medium">
              Let's set up your personalized PTO tracker in just a few steps!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'current-pto',
      title: 'How many PTO hours do you have right now?',
      subtitle: 'Enter your current PTO balance',
      content: (
        <div className="space-y-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-8">
            <Clock className="w-12 h-12 text-white" />
          </div>
          <div className="max-w-md mx-auto">
            <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
              Current PTO Balance
            </label>
            <div className="relative">
              <input
                type="number"
                value={currentPTOInputValue}
                onChange={(e) => setCurrentPTOInputValue(e.target.value)}
                onBlur={handleCurrentPTOBlur}
                className="w-full px-6 py-4 text-2xl font-bold text-center border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 shadow-soft transition-all duration-200 text-gray-900 dark:text-white"
                min="0"
                step="0.01"
                placeholder="96.00"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-medium">
                hours
              </span>
            </div>
            <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
              Equivalent to {(formData.currentPTO / 8).toFixed(2)} days
              <br />
              <span className="text-sm">(8 hours = 1 work day)</span>
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
            <p className="text-amber-700 dark:text-amber-300 text-sm text-center">
              💡 Check your latest paystub or HR portal for your exact balance
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pay-schedule',
      title: 'How often do you get your paycheck?',
      subtitle: 'And how many PTO hours do you earn per paycheck?',
      content: (
        <div className="space-y-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-8">
            <Briefcase className="w-12 h-12 text-white" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                Pay Period
              </label>
              <select
                value={formData.payPeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, payPeriod: e.target.value as UserSettings['payPeriod'] }))}
                className="w-full px-4 py-4 text-lg border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 shadow-soft transition-all duration-200 text-gray-900 dark:text-white"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly (Every 2 weeks))</option>
                <option value="semimonthly">Semi-monthly (1st & 15th)</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                PTO Hours per Paycheck
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={accrualRateInputValue}
                  onChange={(e) => setAccrualRateInputValue(e.target.value)}
                  onBlur={handleAccrualRateBlur}
                  className="w-full px-4 py-4 text-lg text-center border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 shadow-soft transition-all duration-200 text-gray-900 dark:text-white"
                  min="0"
                  step="0.01"
                  placeholder="13.36"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                  hours
                </span>
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm">
                ≈ {(formData.accrualRate / 8).toFixed(2)} days per paycheck
              </p>
            </div>
          </div>
          
          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-200 dark:border-primary-700 max-w-md mx-auto">
            <p className="text-primary-700 dark:text-primary-300 text-sm text-center">
              💡 This info is usually on your paystub or employee handbook
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'start-date',
      title: 'When did you start your job?',
      subtitle: 'This helps us track your PTO history accurately',
      content: (
        <div className="space-y-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mb-8">
            <Building className="w-12 h-12 text-white" />
          </div>
          
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                Employment Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-6 py-4 text-lg text-center border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 shadow-soft transition-all duration-200 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                Annual PTO Allowance (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={annualAllowanceInputValue}
                  onChange={(e) => setAnnualAllowanceInputValue(e.target.value)}
                  onBlur={handleAnnualAllowanceBlur}
                  className="w-full px-6 py-4 text-lg text-center border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 shadow-soft transition-all duration-200 text-gray-900 dark:text-white"
                  min="0"
                  step="0.01"
                  placeholder="200.00"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                  hours/year
                </span>
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm">
                ≈ {(formData.annualAllowance / 8).toFixed(2)} days per year
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700 max-w-md mx-auto">
            <p className="text-green-700 dark:text-green-300 text-sm text-center">
              🎯 We'll use this to calculate your PTO projections more accurately
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      subtitle: 'PTOPal is ready to help you plan your perfect vacation',
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to PTOPal!</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your personalized PTO tracker is now configured and ready to use.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-8 rounded-xl border border-primary-200/50 dark:border-primary-700/50 max-w-lg mx-auto">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Setup Summary:</h4>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current PTO:</span>
                <span className="font-bold text-gray-900 dark:text-white">{formData.currentPTO.toFixed(2)} hours ({(formData.currentPTO / 8).toFixed(2)} days)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pay Period:</span>
                <span className="font-bold text-gray-900 dark:text-white capitalize">{formData.payPeriod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Accrual Rate:</span>
                <span className="font-bold text-gray-900 dark:text-white">{formData.accrualRate.toFixed(2)} hrs/paycheck</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Annual Allowance:</span>
                <span className="font-bold text-gray-900 dark:text-white">{formData.annualAllowance.toFixed(2)} hours</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-gray-400">
              You can always update these settings later in your profile.
            </p>
            <button
              onClick={() => onComplete(formData)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-medium hover:shadow-large flex items-center justify-center mx-auto"
            >
              Start Using PTOPal
              <Sparkles className="ml-3 w-6 h-6" />
            </button>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Bolt Badge */}
      <BoltBadge />

      {/* Header */}
      <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-soft">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">PTOPal Setup</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Step {currentSlide + 1} of {slides.length}</p>
                </div>
              </div>
            </div>
            
            {/* Progress Bar and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center min-h-[calc(100vh-120px)] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-large border border-gray-100 dark:border-gray-700 p-8 sm:p-12 relative overflow-hidden">
            <div className="relative">
              {/* Slide Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentSlideData.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {currentSlideData.subtitle}
                </p>
              </div>

              {/* Slide Content */}
              <div className="mb-12">
                {currentSlideData.content}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    currentSlide === 0
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <div className="flex space-x-2">
                  {slides.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 scale-125'
                          : index < currentSlide
                          ? 'bg-green-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {currentSlide < slides.length - 1 ? (
                  <button
                    onClick={nextSlide}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-soft hover:shadow-medium transform hover:scale-105"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-24"></div> // Spacer for layout consistency
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}