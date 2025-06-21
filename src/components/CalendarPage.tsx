import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, DollarSign, Plus, X, Edit3, Trash2, MapPin, Save } from 'lucide-react';
import BoltBadge from './BoltBadge';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import { 
  calculatePTOForTargetDate, 
  getVacationsForDate, 
  generateVacationId, 
  formatDateRange,
  calculateVacationHours,
  normalizeDate
} from '../utils/dateUtils';

interface CalendarPageProps {
  onBack: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

interface PayPeriodEvent {
  date: Date;
  ptoAccrued: number;
  totalPTO: number;
  isPayDay: boolean;
}

interface DayInfo {
  date: Date;
  ptoBalance: number;
  isPayDay: boolean;
  vacations: VacationEntry[];
  ptoAccrued?: number;
}

interface VacationFormData {
  startDate: string;
  endDate: string;
  includeWeekends: boolean;
  description: string;
}

export default function CalendarPage({ onBack, userSettings, onUpdateSettings }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddVacationModalOpen, setIsAddVacationModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationEntry | null>(null);
  const [vacationForm, setVacationForm] = useState<VacationFormData>({
    startDate: '',
    endDate: '',
    includeWeekends: false,
    description: ''
  });
  
  const payPeriodOptions = {
    weekly: { days: 7, label: 'Weekly' },
    biweekly: { days: 14, label: 'Bi-weekly' },
    semimonthly: { days: 15, label: 'Semi-monthly' }, // Approximate
    monthly: { days: 30, label: 'Monthly' } // Approximate
  };

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number) => (hours / 8).toFixed(1);

  const generatePayPeriods = useMemo(() => {
    const events: PayPeriodEvent[] = [];
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Start from the beginning of the year to get accurate running totals
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    let currentPayDate = new Date(startOfYear);
    let runningPTO = userSettings.currentPTO;
    
    // Calculate all pay periods from start of year to current month
    const allEvents: PayPeriodEvent[] = [];
    
    // For semi-monthly, use 1st and 15th of each month
    if (userSettings.payPeriod === 'semimonthly') {
      for (let month = 0; month < 12; month++) {
        // First pay period (1st of month)
        const firstPayDate = new Date(currentDate.getFullYear(), month, 1);
        runningPTO += userSettings.accrualRate;
        allEvents.push({
          date: firstPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: runningPTO,
          isPayDay: true
        });
        
        // Second pay period (15th of month)
        const secondPayDate = new Date(currentDate.getFullYear(), month, 15);
        runningPTO += userSettings.accrualRate;
        allEvents.push({
          date: secondPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: runningPTO,
          isPayDay: true
        });
      }
    } else {
      // For other pay periods, calculate based on interval
      const intervalDays = payPeriodOptions[userSettings.payPeriod as keyof typeof payPeriodOptions]?.days || 30;
      
      while (currentPayDate.getFullYear() === currentDate.getFullYear()) {
        runningPTO += userSettings.accrualRate;
        allEvents.push({
          date: new Date(currentPayDate),
          ptoAccrued: userSettings.accrualRate,
          totalPTO: runningPTO,
          isPayDay: true
        });
        
        currentPayDate.setDate(currentPayDate.getDate() + intervalDays);
      }
    }
    
    // Filter to only show events in the current month
    return allEvents.filter(event => 
      event.date >= startOfMonth && event.date <= endOfMonth
    );
  }, [currentDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod]);

  // Calculate daily PTO balances for the entire month
  const dailyPTOBalances = useMemo(() => {
    const balances: { [key: string]: DayInfo } = {};
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const currentDay = new Date(startOfMonth);
    while (currentDay <= endOfMonth) {
      const dateKey = currentDay.toISOString().split('T')[0];
      const ptoBalance = calculatePTOForTargetDate(
        userSettings.currentPTO,
        userSettings.accrualRate,
        userSettings.payPeriod,
        userSettings.vacations,
        new Date(currentDay)
      );
      
      const payPeriodEvent = generatePayPeriods.find(event => 
        event.date.getDate() === currentDay.getDate() &&
        event.date.getMonth() === currentDay.getMonth() &&
        event.date.getFullYear() === currentDay.getFullYear()
      );
      
      const vacationsForDay = getVacationsForDate(new Date(currentDay), userSettings.vacations);
      
      balances[dateKey] = {
        date: new Date(currentDay),
        ptoBalance,
        isPayDay: !!payPeriodEvent,
        vacations: vacationsForDay,
        ptoAccrued: payPeriodEvent?.ptoAccrued
      };
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return balances;
  }, [currentDate, userSettings, generatePayPeriods]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = clickedDate.toISOString().split('T')[0];
    const dayInfo = dailyPTOBalances[dateKey];
    
    if (dayInfo && dayInfo.vacations.length > 0) {
      // Edit existing vacation
      const vacation = dayInfo.vacations[0]; // Edit the first vacation if multiple
      setEditingVacation(vacation);
      setVacationForm({
        startDate: vacation.startDate,
        endDate: vacation.endDate,
        includeWeekends: vacation.includeWeekends,
        description: vacation.description || ''
      });
    } else {
      // Add new vacation
      setEditingVacation(null);
      setVacationForm({
        startDate: dateKey,
        endDate: dateKey,
        includeWeekends: false,
        description: ''
      });
    }
    setIsAddVacationModalOpen(true);
  };

  const handleAddVacation = () => {
    setEditingVacation(null);
    const today = new Date().toISOString().split('T')[0];
    setVacationForm({
      startDate: today,
      endDate: today,
      includeWeekends: false,
      description: ''
    });
    setIsAddVacationModalOpen(true);
  };

  const handleSaveVacation = () => {
    if (!vacationForm.startDate || !vacationForm.endDate) return;
    
    const totalHours = calculateVacationHours(
      vacationForm.startDate,
      vacationForm.endDate,
      vacationForm.includeWeekends
    );
    
    const now = new Date().toISOString();
    
    if (editingVacation) {
      // Update existing vacation
      const updatedVacations = userSettings.vacations.map(vacation =>
        vacation.id === editingVacation.id
          ? {
              ...vacation,
              startDate: vacationForm.startDate,
              endDate: vacationForm.endDate,
              totalHours,
              includeWeekends: vacationForm.includeWeekends,
              description: vacationForm.description,
              updatedAt: now
            }
          : vacation
      );
      onUpdateSettings({ vacations: updatedVacations });
    } else {
      // Add new vacation
      const newVacation: VacationEntry = {
        id: generateVacationId(),
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        totalHours,
        includeWeekends: vacationForm.includeWeekends,
        description: vacationForm.description,
        createdAt: now,
        updatedAt: now
      };
      onUpdateSettings({ vacations: [...userSettings.vacations, newVacation] });
    }
    
    setIsAddVacationModalOpen(false);
    setEditingVacation(null);
  };

  const handleDeleteVacation = (vacationId: string) => {
    const updatedVacations = userSettings.vacations.filter(vacation => vacation.id !== vacationId);
    onUpdateSettings({ vacations: updatedVacations });
    setIsAddVacationModalOpen(false);
    setEditingVacation(null);
  };

  const calculateFormHours = () => {
    if (!vacationForm.startDate || !vacationForm.endDate) return 0;
    return calculateVacationHours(
      vacationForm.startDate,
      vacationForm.endDate,
      vacationForm.includeWeekends
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const totalPTOThisMonth = generatePayPeriods.reduce((sum, event) => sum + event.ptoAccrued, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Bolt Badge */}
      <BoltBadge />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">PTO Calendar</h1>
                  <p className="text-slate-600">Track your pay periods and plan vacations</p>
                </div>
              </div>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddVacation}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vacation</span>
              </button>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }, (_, index) => (
                  <div key={`empty-${index}`} className="p-3 h-32"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
                  const dayInfo = dailyPTOBalances[dateKey];
                  const todayClass = isToday(day);

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`p-2 h-32 border border-slate-100 rounded-lg relative transition-all duration-200 cursor-pointer hover:bg-slate-50 ${
                        todayClass 
                          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' 
                          : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        todayClass ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {day}
                      </div>
                      
                      {/* Pay Day Indicator with Total PTO */}
                      {dayInfo?.isPayDay && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-2 py-1 rounded-md shadow-sm mb-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-medium">Pay Day</span>
                          </div>
                          <div className="text-xs opacity-90 font-medium">
                            {dayInfo.ptoBalance.toFixed(0)} hrs total
                          </div>
                          <div className="text-xs opacity-75">
                            ({hoursToDays(dayInfo.ptoBalance)}d)
                          </div>
                        </div>
                      )}
                      
                      {/* Vacation Indicators */}
                      {dayInfo?.vacations.map((vacation, idx) => (
                        <div key={vacation.id} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-1 py-0.5 rounded mb-1">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-2 h-2" />
                            <span className="font-medium truncate">
                              {vacation.description || 'Vacation'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Monthly Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">This Month</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Pay Periods</span>
                  <span className="font-bold text-slate-900">{generatePayPeriods.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">PTO Earned</span>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">+{totalPTOThisMonth.toFixed(1)} hrs</div>
                    <div className="text-xs text-slate-600">(+{hoursToDays(totalPTOThisMonth)} days)</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Planned Vacations</span>
                  <span className="font-bold text-slate-900">{userSettings.vacations.length}</span>
                </div>
                
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Rate per Period</span>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{userSettings.accrualRate} hrs</div>
                      <div className="text-xs text-slate-600">({hoursToDays(userSettings.accrualRate)} days)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Vacations */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Upcoming Vacations</h3>
              </div>
              
              <div className="space-y-3">
                {userSettings.vacations
                  .filter(vacation => new Date(vacation.endDate) >= new Date())
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .slice(0, 3)
                  .map((vacation) => (
                    <div key={vacation.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-900">
                          {vacation.description || 'Vacation'}
                        </div>
                        <div className="text-xs text-slate-600">
                          {formatDateRange(vacation.startDate, vacation.endDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{vacation.totalHours} hrs</div>
                        <div className="text-xs text-slate-600">({hoursToDays(vacation.totalHours)}d)</div>
                      </div>
                    </div>
                  ))}
                
                {userSettings.vacations.filter(vacation => new Date(vacation.endDate) >= new Date()).length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    No upcoming vacations
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Legend</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded"></div>
                  <span className="text-sm text-slate-700">Pay Day + Total PTO Balance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded"></div>
                  <span className="text-sm text-slate-700">Vacation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded"></div>
                  <span className="text-sm text-slate-700">Today</span>
                </div>
                <div className="text-xs text-slate-600 mt-3 p-2 bg-slate-100 rounded">
                  <strong>Tip:</strong> Click on any day to add or edit vacations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vacation Modal */}
      {isAddVacationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingVacation ? 'Edit Vacation' : 'Add Vacation'}
                </h3>
                <button
                  onClick={() => setIsAddVacationModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={vacationForm.description}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., Hawaii Trip, Family Visit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={vacationForm.startDate}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={vacationForm.endDate}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min={vacationForm.startDate}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeWeekends"
                    checked={vacationForm.includeWeekends}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, includeWeekends: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="includeWeekends" className="text-sm font-medium text-slate-700">
                    Include weekends in PTO calculation
                  </label>
                </div>

                {vacationForm.startDate && vacationForm.endDate && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200/50">
                    <div className="text-center">
                      <div className="text-sm text-blue-700 font-semibold mb-1">
                        Total PTO Required
                      </div>
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        {calculateFormHours()} hours
                      </div>
                      <div className="text-sm text-slate-600">
                        ({hoursToDays(calculateFormHours())} days)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                {editingVacation && (
                  <button
                    onClick={() => handleDeleteVacation(editingVacation.id)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                
                <div className="flex items-center space-x-3 ml-auto">
                  <button
                    onClick={() => setIsAddVacationModalOpen(false)}
                    className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVacation}
                    disabled={!vacationForm.startDate || !vacationForm.endDate}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingVacation ? 'Update' : 'Save'} Vacation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}