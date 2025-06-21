import React, { useState } from 'react';
import { User, Calendar, Clock, Save, ArrowLeft, Settings, Calculator, Shield } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';

interface ProfilePageProps {
  onBack: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export default function ProfilePage({ onBack, userSettings, onUpdateSettings }: ProfilePageProps) {
  const [formData, setFormData] = useState<UserSettings>(userSettings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    // Convert any empty string number fields to 0 before saving
    const sanitizedData = {
      ...formData,
      currentPTO: formData.currentPTO === '' ? 0 : Number(formData.currentPTO),
      accrualRate: formData.accrualRate === '' ? 0 : Number(formData.accrualRate),
      annualAllowance: formData.annualAllowance === '' ? 0 : Number(formData.annualAllowance)
    };
    
    onUpdateSettings(sanitizedData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
    
    // Auto-save to localStorage on every change, but convert empty strings to 0 for storage
    const valueForStorage = (field === 'currentPTO' || field === 'accrualRate' || field === 'annualAllowance') && value === '' 
      ? 0 
      : processedValue;
    
    onUpdateSettings({ [field]: valueForStorage });
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
    return accrualValue * selectedPeriod.periodsPerMonth;
  };

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number | string) => {
    const numHours = hours === '' ? 0 : Number(hours);
    return (numHours / 8).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50">
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
                  <p className="text-slate-600">Manage your PTO preferences and accrual settings</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Auto-saved locally
              </div>
              <button
                onClick={handleSave}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isSaved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* PTO Configuration */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">PTO Configuration</h2>
                  <p className="text-slate-600">Set up your time off accrual and balance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Current PTO Balance (hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.currentPTO}
                      onChange={(e) => handleInputChange('currentPTO', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                      min="0"
                      step="0.5"
                      placeholder="96"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Equivalent to {hoursToDays(formData.currentPTO)} days (8 hours = 1 day)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Annual PTO Allowance (hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.annualAllowance}
                      onChange={(e) => handleInputChange('annualAllowance', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                      min="0"
                      placeholder="200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Equivalent to {hoursToDays(formData.annualAllowance)} days per year
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Pay Period
                  </label>
                  <select
                    value={formData.payPeriod}
                    onChange={(e) => handleInputChange('payPeriod', e.target.value as UserSettings['payPeriod'])}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                  >
                    {payPeriodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Accrual Rate per {payPeriodOptions.find(p => p.value === formData.payPeriod)?.label || 'Period'} (hours)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.accrualRate}
                      onChange={(e) => handleInputChange('accrualRate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                      min="0"
                      step="0.1"
                      placeholder="13.36"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    How many PTO hours you earn each {formData.payPeriod === 'biweekly' ? 'bi-weekly' : formData.payPeriod === 'semimonthly' ? 'semi-monthly' : formData.payPeriod} pay period
                    <br />
                    Equivalent to {hoursToDays(formData.accrualRate)} days per pay period
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Company Information</h2>
                  <p className="text-slate-600">Optional details for better tracking</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="EMP001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Employment Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Current Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <Calculator className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Current Summary</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">PTO Balance</span>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formData.currentPTO === '' ? 0 : formData.currentPTO} hours</div>
                    <div className="text-xs text-slate-600">({hoursToDays(formData.currentPTO)} days)</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Monthly Accrual</span>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">+{getMonthlyAccrual().toFixed(2)} hours</div>
                    <div className="text-xs text-slate-600">(+{hoursToDays(getMonthlyAccrual())} days)</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Annual Allowance</span>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formData.annualAllowance === '' ? 0 : formData.annualAllowance} hours</div>
                    <div className="text-xs text-slate-600">({hoursToDays(formData.annualAllowance)} days)</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Usage Rate</span>
                    <span className="font-bold text-blue-600">
                      {Math.round(((formData.currentPTO === '' ? 0 : Number(formData.currentPTO)) / (formData.annualAllowance === '' ? 1 : Number(formData.annualAllowance))) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Storage Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900">Data Storage</h3>
              </div>
              
              <div className="space-y-3 text-sm text-slate-700">
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
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Quick Tips</h3>
              </div>
              
              <ul className="space-y-2 text-sm text-slate-700">
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