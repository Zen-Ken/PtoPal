import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, ArrowLeft, Settings, Calculator, Shield, Check } from 'lucide-react';
import BoltBadge from './BoltBadge';
import ThemeToggle from './ThemeToggle';
import { UserSettings } from '../types/UserSettings';

interface ProfilePageProps {
  onBack: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export default function ProfilePage({ onBack, userSettings, onUpdateSettings }: ProfilePageProps) {
  const [formData, setFormData] = useState<UserSettings>(userSettings);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const showNotification = () => {
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2000);
  };

  const handleInputChange = (field: keyof UserSettings, value: any) => {
    let processedValue = value;
    
    // For number fields, allow empty string for better UX
    if (field === 'currentPTO' || field === 'accrualRate' || field === 'annualAllowance') {
      if (value === '') {
        processedValue = '';
      } else {
        processedValue = Number(value);
      }
    }
    
    const updatedData = { ...formData, [field]: processedValue };
    setFormData(updatedData);
    
    // Auto-save to localStorage on every change, but convert empty strings to 0 for storage and round to 2 decimal places
    let valueForStorage = processedValue;
    if (field === 'currentPTO' || field === 'accrualRate' || field === 'annualAllowance') {
      if (value === '') {
        valueForStorage = 0;
      } else {
        valueForStorage = Math.round(Number(value) * 100) / 100;
      }
    }
    
    onUpdateSettings({ [field]: valueForStorage });
    
    // Show notification for auto-save
    showNotification();
  };

  const payPeriodOptions = [
    { value: 'weekly', label: 'Weekly', periodsPerMonth: 4.33 },
    { value: 'biweekly', label: 'Bi-weekly', periodsPerMonth: 2.17 },
    { value: 'semimonthly', label: 'Semi-monthly', periodsPerMonth: 2 },
    { value: 'monthly', label: 'Monthly', periodsPerMonth: 1 }
  ];

  const getMonthlyAccrual = () => {
    const selectedPeriod = payPeriodOptions.find(p => p.value === formData.payPeriod);
    if (!selectedPeriod) return formData.accrualRate;
    
    // The accrual rate is now per pay period, so convert to monthly
    const accrualValue = formData.accrualRate === '' ? 0 : Number(formData.accrualRate);
    return Math.round(accrualValue * selectedPeriod.periodsPerMonth * 100) / 100;
  };

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number | string) => {
    const numHours = hours === '' ? 0 : Number(hours);
    return (numHours / 8).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Bolt Badge */}
      <BoltBadge />

      {/* Auto-save Notification */}
      <div className={`fixed top-20 right-4 z-40 transition-all duration-300 transform ${
        showSavedNotification 
          ? 'translate-y-0 opacity-100 scale-100' 
          : '-translate-y-2 opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-large flex items-center space-x-3">
          <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">Settings saved automatically</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
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
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                  <p className="text-gray-600 dark:text-gray-400">Manage your PTO preferences and accrual settings</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200 dark:border-green-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-saving</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* PTO Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">PTO Configuration</h2>
                  <p className="text-gray-600 dark:text-gray-400">Set up your time off accrual and balance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Current PTO Balance (hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.currentPTO}
                      onChange={(e) => handleInputChange('currentPTO', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="96.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Equivalent to {hoursToDays(formData.currentPTO)} days (8 hours = 1 day)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Annual PTO Allowance (hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.annualAllowance}
                      onChange={(e) => handleInputChange('annualAllowance', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="200.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Equivalent to {hoursToDays(formData.annualAllowance)} days per year
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Pay Period
                  </label>
                  <select
                    value={formData.payPeriod}
                    onChange={(e) => handleInputChange('payPeriod', e.target.value as UserSettings['payPeriod'])}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                  >
                    {payPeriodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Accrual Rate per {payPeriodOptions.find(p => p.value === formData.payPeriod)?.label || 'Period'} (hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.accrualRate}
                      onChange={(e) => handleInputChange('accrualRate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      placeholder="13.36"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    How many PTO hours you earn each {formData.payPeriod === 'biweekly' ? 'bi-weekly' : formData.payPeriod === 'semimonthly' ? 'semi-monthly' : formData.payPeriod} pay period
                    <br />
                    Equivalent to {hoursToDays(formData.accrualRate)} days per pay period
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Company Information</h2>
                  <p className="text-gray-600 dark:text-gray-400">Optional details for better tracking</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Employment Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Current Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200/50 dark:border-primary-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Calculator className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Summary</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">PTO Balance</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{(formData.currentPTO === '' ? 0 : Number(formData.currentPTO)).toFixed(2)} hours</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">({hoursToDays(formData.currentPTO)} days)</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Accrual</span>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">+{getMonthlyAccrual().toFixed(2)} hours</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">(+{hoursToDays(getMonthlyAccrual())} days)</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Allowance</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{(formData.annualAllowance === '' ? 0 : Number(formData.annualAllowance)).toFixed(2)} hours</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">({hoursToDays(formData.annualAllowance)} days)</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-primary-200 dark:border-primary-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Usage Rate</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {Math.round(((formData.currentPTO === '' ? 0 : Number(formData.currentPTO)) / (formData.annualAllowance === '' ? 1 : Number(formData.annualAllowance))) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Storage Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Storage</h3>
              </div>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Stored locally in your browser</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>No data sent to servers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Automatically saved on changes</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-6 border border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Tips</h3>
              </div>
              
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Update your balance after taking time off</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Check with HR for exact accrual rates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Consider PTO expiration policies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>8 hours typically equals 1 work day</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}