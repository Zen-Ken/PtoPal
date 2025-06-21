import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Briefcase, CheckCircle, Sparkles, User, Building } from 'lucide-react';
import BoltBadge from './BoltBadge';
import { UserSettings, defaultUserSettings } from '../types/UserSettings';

interface OnboardingPageProps {
  onComplete: (settings: UserSettings) => void;
  onBack: () => void;
}

export default function OnboardingPage({ onComplete, onBack }: OnboardingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState<UserSettings>(defaultUserSettings);
  
  // Local input states for better UX
  const [currentPTOInputValue, setCurrentPTOInputValue] = useState(defaultUserSettings.currentPTO.toString());
  const [accrualRateInputValue, setAccrualRateInputValue] = useState(defaultUserSettings.accrualRate.toString());
  const [annualAllowanceInputValue, setAnnualAllowanceInputValue] = useState(defaultUserSettings.annualAllowance.toString());

  const handleCurrentPTOBlur = () => {
    const numericValue = currentPTOInputValue === '' ? 0 : Number(currentPTOInputValue);
    setFormData(prev => ({ ...prev, currentPTO: numericValue }));
  };

  const handleAccrualRateBlur = () => {
    const numericValue = accrualRateInputValue === '' ? 0 : Number(accrualRateInputValue);
    setFormData(prev => ({ ...prev, accrualRate: numericValue }));
  };

  const handleAnnualAllowanceBlur = () => {
    const numericValue = annualAllowanceInputValue === '' ? 0 : Number(annualAllowanceInputValue);
    setFormData(prev => ({ ...prev, annualAllowance: numericValue }));
  };

  const slides = [
    {
      id: 'welcome',
      title: 'Do you ever ask yourself...',
      subtitle: 'If you have enough PTO for your vacation?',
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
            <Calendar className="w-16 h-16 text-blue-600" />
          </div>
          <div className="space-y-4">
            <p className="text-xl text-slate-600 leading-relaxed">
              Planning time off shouldn't be stressful or confusing.
            </p>
            <p className="text-lg text-slate-500">
              PTOPal is the tool you need to take control of your vacation planning.
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200/50">
            <p className="text-blue-700 font-medium">
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
            <label className="block text-lg font-semibold text-slate-700 mb-4 text-center">
              Current PTO Balance
            </label>
            <div className="relative">
              <input
                type="number"
                value={currentPTOInputValue}
                onChange={(e) => setCurrentPTOInputValue(e.target.value)}
                onBlur={handleCurrentPTOBlur}
                className="w-full px-6 py-4 text-2xl font-bold text-center border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
                min="0"
                step="0.5"
                placeholder="96"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-medium">
                hours
              </span>
            </div>
            <p className="text-center text-slate-500 mt-4">
              Equivalent to {(formData.currentPTO / 8).toFixed(1)} days
              <br />
              <span className="text-sm">(8 hours = 1 work day)</span>
            </p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="text-amber-700 text-sm text-center">
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
              <label className="block text-lg font-semibold text-slate-700 mb-4 text-center">
                Pay Period
              </label>
              <select
                value={formData.payPeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, payPeriod: e.target.value as UserSettings['payPeriod'] }))}
                className="w-full px-4 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                <option value="semimonthly">Semi-monthly (1st & 15th)</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-slate-700 mb-4 text-center">
                PTO Hours per Paycheck
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={accrualRateInputValue}
                  onChange={(e) => setAccrualRateInputValue(e.target.value)}
                  onBlur={handleAccrualRateBlur}
                  className="w-full px-4 py-4 text-lg text-center border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
                  min="0"
                  step="0.1"
                  placeholder="13.36"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                  hours
                </span>
              </div>
              <p className="text-center text-slate-500 mt-2 text-sm">
                ≈ {(formData.accrualRate / 8).toFixed(2)} days per paycheck
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 max-w-md mx-auto">
            <p className="text-blue-700 text-sm text-center">
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
              <label className="block text-lg font-semibold text-slate-700 mb-4 text-center">
                Employment Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-6 py-4 text-lg text-center border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-slate-700 mb-4 text-center">
                Annual PTO Allowance (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={annualAllowanceInputValue}
                  onChange={(e) => setAnnualAllowanceInputValue(e.target.value)}
                  onBlur={handleAnnualAllowanceBlur}
                  className="w-full px-6 py-4 text-lg text-center border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
                  min="0"
                  placeholder="200"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                  hours/year
                </span>
              </div>
              <p className="text-center text-slate-500 mt-2 text-sm">
                ≈ {(formData.annualAllowance / 8).toFixed(1)} days per year
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 max-w-md mx-auto">
            <p className="text-green-700 text-sm text-center">
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
            <h3 className="text-2xl font-bold text-slate-900">Welcome to PTOPal!</h3>
            <p className="text-lg text-slate-600">
              Your personalized PTO tracker is now configured and ready to use.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-200/50 max-w-lg mx-auto">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Your Setup Summary:</h4>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Current PTO:</span>
                <span className="font-bold text-slate-900">{formData.currentPTO} hours ({(formData.currentPTO / 8).toFixed(1)} days)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Pay Period:</span>
                <span className="font-bold text-slate-900 capitalize">{formData.payPeriod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Accrual Rate:</span>
                <span className="font-bold text-slate-900">{formData.accrualRate} hrs/paycheck</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Annual Allowance:</span>
                <span className="font-bold text-slate-900">{formData.annualAllowance} hours</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-slate-500">
              You can always update these settings later in your profile.
            </p>
            <button
              onClick={() => onComplete(formData)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center mx-auto"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Bolt Badge */}
      <BoltBadge />

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">PTOPal Setup</h1>
                  <p className="text-slate-600 text-sm">Step {currentSlide + 1} of {slides.length}</p>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-4">
              <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-slate-600 min-w-[3rem]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center min-h-[calc(100vh-120px)] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-12 relative overflow-hidden">
            {/* Card decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative">
              {/* Slide Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  {currentSlideData.title}
                </h2>
                <p className="text-xl text-slate-600">
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
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentSlide === 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125'
                          : index < currentSlide
                          ? 'bg-green-400'
                          : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {currentSlide < slides.length - 1 ? (
                  <button
                    onClick={nextSlide}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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