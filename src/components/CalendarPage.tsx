import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, DollarSign, Plus, Edit3, MapPin, Calculator, Target, Home } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import PaydayTooltip from './PaydayTooltip';
import VacationModal from './VacationModal';
import { 
  calculatePTOForTargetDate, 
  getVacationsForDate, 
  formatDateRange,
  normalizeDate,
  createDateFromString,
  getProjectedPTOBalance,
  getNextDayOfWeek
} from '../utils/dateUtils';

interface CalendarPageProps {
  onBack: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
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
  totalPTOOnPayDay?: number;
}

export default function CalendarPage({ onBack, userSettings, onUpdateSettings, selectedDate, setSelectedDate }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddVacationModalOpen, setIsAddVacationModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationEntry | null>(null);
  const [openTooltipDate, setOpenTooltipDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [modalInitialDates, setModalInitialDates] = useState({ startDate: '', endDate: '' });

  // Set calendar month to match the selected date from Home page
  useEffect(() => {
    if (selectedDate) {
      const targetDate = createDateFromString(selectedDate);
      // Only update if the month/year is different from current display
      if (targetDate.getMonth() !== currentDate.getMonth() || 
          targetDate.getFullYear() !== currentDate.getFullYear()) {
        setCurrentDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
      }
    }
  }, [selectedDate]); // Remove currentDate from dependencies to avoid infinite loop
  
  const payPeriodOptions = {
    weekly: { days: 7, label: 'Weekly' },
    biweekly: { days: 14, label: 'Bi-weekly' },
    semimonthly: { days: 15, label: 'Semi-monthly' }, // Approximate
    monthly: { days: 'end-of-month', label: 'Monthly' } // End of month
  };

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number) => (hours / 8).toFixed(2);

  // Calculate projected PTO balance for the selected future date
  const projectedPTOData = useMemo(() => {
    if (!selectedDate) return null;
    
    const targetDate = createDateFromString(selectedDate);
    return getProjectedPTOBalance(
      userSettings.currentPTO,
      userSettings.accrualRate,
      userSettings.payPeriod,
      userSettings.vacations,
      targetDate,
      new Date(),
      userSettings.paydayOfWeek
    );
  }, [selectedDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod, userSettings.vacations, userSettings.paydayOfWeek]);

  // Helper functions - moved before useMemo hooks that use them
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generatePayPeriods = useMemo(() => {
    const events: PayPeriodEvent[] = [];
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // For semi-monthly, use 15th and last day of each month
    if (userSettings.payPeriod === 'semimonthly') {
      // First pay period (15th of month)
      const fifteenthPayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (fifteenthPayDate >= startOfMonth && fifteenthPayDate <= endOfMonth) {
        const projectedData = getProjectedPTOBalance(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          fifteenthPayDate,
          new Date(),
          userSettings.paydayOfWeek
        );
        
        events.push({
          date: fifteenthPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(projectedData.projectedBalance * 100) / 100,
          isPayDay: true
        });
      }
      
      // Second pay period (last day of month)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      if (lastDayOfMonth >= startOfMonth && lastDayOfMonth <= endOfMonth) {
        const projectedData = getProjectedPTOBalance(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          lastDayOfMonth,
          new Date(),
          userSettings.paydayOfWeek
        );
        
        events.push({
          date: lastDayOfMonth,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(projectedData.projectedBalance * 100) / 100,
          isPayDay: true
        });
      }
    } else if (userSettings.payPeriod === 'monthly') {
      // For monthly, use last day of each month
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      if (lastDayOfMonth >= startOfMonth && lastDayOfMonth <= endOfMonth) {
        const projectedData = getProjectedPTOBalance(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          lastDayOfMonth,
          new Date(),
          userSettings.paydayOfWeek
        );
        
        events.push({
          date: lastDayOfMonth,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(projectedData.projectedBalance * 100) / 100,
          isPayDay: true
        });
      }
    } else if (userSettings.payPeriod === 'weekly' || userSettings.payPeriod === 'biweekly') {
      // For weekly and biweekly, use the paydayOfWeek setting
      const intervalDays = userSettings.payPeriod === 'weekly' ? 7 : 14;
      const paydayOfWeek = userSettings.paydayOfWeek ?? 5; // Default to Friday
      
      // Find the first payday of the specified day of week in the current month
      let currentPayday = getNextDayOfWeek(startOfMonth, paydayOfWeek);
      
      // If the first payday is before the start of the month, move to the next one
      if (currentPayday < startOfMonth) {
        currentPayday.setDate(currentPayday.getDate() + intervalDays);
      }
      
      // Generate all paydays within the current month
      while (currentPayday <= endOfMonth) {
        const projectedData = getProjectedPTOBalance(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          currentPayday,
          new Date(),
          userSettings.paydayOfWeek
        );
        
        events.push({
          date: new Date(currentPayday),
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(projectedData.projectedBalance * 100) / 100,
          isPayDay: true
        });
        
        // Move to next payday
        currentPayday.setDate(currentPayday.getDate() + intervalDays);
      }
    }
    
    return events;
  }, [currentDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod, userSettings.vacations, userSettings.paydayOfWeek]);

  // Calculate daily PTO balances for the entire month
  const dailyPTOBalances = useMemo(() => {
    const balances: { [key: string]: DayInfo } = {};
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const currentDay = new Date(startOfMonth);
    while (currentDay <= endOfMonth) {
      // Create a proper date key that matches the calendar day
      const year = currentDay.getFullYear();
      const month = currentDay.getMonth();
      const day = currentDay.getDate();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const projectedData = getProjectedPTOBalance(
        userSettings.currentPTO,
        userSettings.accrualRate,
        userSettings.payPeriod,
        userSettings.vacations,
        new Date(currentDay),
        new Date(),
        userSettings.paydayOfWeek
      );
      
      const payPeriodEvent = generatePayPeriods.find(event => 
        event.date.getDate() === currentDay.getDate() &&
        event.date.getMonth() === currentDay.getMonth() &&
        event.date.getFullYear() === currentDay.getFullYear()
      );
      
      // Create a date object for this specific day to check vacations
      const dayDate = new Date(year, month, day);
      const vacationsForDay = getVacationsForDate(dayDate, userSettings.vacations);
      
      balances[dateKey] = {
        date: new Date(currentDay),
        ptoBalance: Math.round(projectedData.projectedBalance * 100) / 100,
        isPayDay: !!payPeriodEvent,
        vacations: vacationsForDay,
        ptoAccrued: payPeriodEvent?.ptoAccrued,
        totalPTOOnPayDay: payPeriodEvent?.totalPTO
      };
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return balances;
  }, [currentDate, userSettings, generatePayPeriods]);

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

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const isFutureDate = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkDateNormalized = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    
    return checkDateNormalized >= todayNormalized;
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkDateNormalized = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    
    return checkDateNormalized < todayNormalized;
  };

  // Check if we're currently viewing today's month
  const isCurrentMonth = () => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const handlePaydayIconHover = (event: React.MouseEvent, dateKey: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setTooltipPosition({
      top: rect.bottom + scrollTop + 8,
      left: Math.max(16, Math.min(rect.left + scrollLeft, window.innerWidth - 336))
    });
    setOpenTooltipDate(dateKey);
  };

  const handlePaydayIconLeave = () => {
    setOpenTooltipDate(null);
  };

  const handlePaydayIconClick = (event: React.MouseEvent, dateKey: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setTooltipPosition({
      top: rect.bottom + scrollTop + 8,
      left: Math.max(16, Math.min(rect.left + scrollLeft, window.innerWidth - 336))
    });
    setOpenTooltipDate(dateKey);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const year = clickedDate.getFullYear();
    const month = clickedDate.getMonth();
    const dayNum = clickedDate.getDate();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayInfo = dailyPTOBalances[dateKey];
    
    if (dayInfo && dayInfo.vacations.length > 0) {
      // Edit existing vacation
      const vacation = dayInfo.vacations[0]; // Edit the first vacation if multiple
      setEditingVacation(vacation);
    } else {
      // Add new vacation
      setEditingVacation(null);
      setModalInitialDates({
        startDate: dateKey,
        endDate: dateKey
      });
    }
    setIsAddVacationModalOpen(true);
  };

  const handleAddVacation = () => {
    setEditingVacation(null);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setModalInitialDates({
      startDate: todayKey,
      endDate: todayKey
    });
    setIsAddVacationModalOpen(true);
  };

  const handleEditVacation = (vacation: VacationEntry) => {
    setEditingVacation(vacation);
    setIsAddVacationModalOpen(true);
  };

  const handleSaveVacation = (vacation: VacationEntry) => {
    if (editingVacation) {
      // Update existing vacation
      const updatedVacations = userSettings.vacations.map(v =>
        v.id === editingVacation.id ? vacation : v
      );
      onUpdateSettings({ vacations: updatedVacations });
    } else {
      // Add new vacation
      onUpdateSettings({ vacations: [...userSettings.vacations, vacation] });
    }
  };

  const handleDeleteVacation = (vacationId: string) => {
    const updatedVacations = userSettings.vacations.filter(vacation => vacation.id !== vacationId);
    onUpdateSettings({ vacations: updatedVacations });
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const date = createDateFromString(selectedDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Sort vacations by start date
  const sortedVacations = [...userSettings.vacations].sort((a, b) => 
    createDateFromString(a.startDate).getTime() - createDateFromString(b.startDate).getTime()
  );

  // Separate upcoming and past vacations
  const today = new Date();
  const upcomingVacations = sortedVacations.filter(vacation => 
    createDateFromString(vacation.endDate) >= today
  );
  const pastVacations = sortedVacations.filter(vacation => 
    createDateFromString(vacation.endDate) < today
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PTO Calendar</h1>
                <p className="text-gray-600 dark:text-gray-400">Track your pay periods and plan vacations</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={handleAddVacation}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vacation</span>
              </button>
              
              <div className="flex items-center justify-between w-full sm:w-auto">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center flex-grow mx-2">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                {!isCurrentMonth() && (
                  <button
                    onClick={jumpToToday}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2 ml-2"
                    title="Jump to current month"
                  >
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Today</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 sm:p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 1)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }, (_, index) => (
                  <div key={`empty-${index}`} className="p-2 h-24 sm:h-32"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayInfo = dailyPTOBalances[dateKey];
                  const todayClass = isToday(day);
                  const isFuture = isFutureDate(day);
                  const isPast = isPastDate(day);

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`p-1 sm:p-2 h-24 sm:h-32 border-2 rounded-lg relative transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        todayClass 
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600 ring-2 ring-primary-200 dark:ring-primary-700' 
                          : dayInfo?.isPayDay
                          ? isFuture
                            ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10'
                            : 'border-gray-400 dark:border-gray-500 bg-gray-50/30 dark:bg-gray-800/10'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${
                        todayClass ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day}
                      </div>
                      
                      {/* Pay Day Dollar Icon */}
                      {dayInfo?.isPayDay && dayInfo.totalPTOOnPayDay !== undefined && (
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                          <button
                            className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                              isFuture 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-soft hover:shadow-medium' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 opacity-60'
                            }`}
                            onMouseEnter={(e) => handlePaydayIconHover(e, dateKey)}
                            onMouseLeave={handlePaydayIconLeave}
                            onClick={(e) => handlePaydayIconClick(e, dateKey)}
                            title="Pay Day - Click for details"
                          >
                            <DollarSign className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </button>
                        </div>
                      )}

                      {/* Individual Vacation Indicators */}
                      {dayInfo?.vacations && dayInfo.vacations.length > 0 && (
                        <div className="space-y-1 mt-4 sm:mt-6">
                          {dayInfo.vacations.slice(0, 2).map((vacation, index) => {
                            const colors = [
                              'from-purple-500 to-pink-600',
                              'from-blue-500 to-indigo-600',
                              'from-green-500 to-emerald-600',
                              'from-orange-500 to-red-600',
                              'from-teal-500 to-cyan-600',
                              'from-rose-500 to-pink-600'
                            ];
                            const colorClass = colors[index % colors.length];
                            
                            return (
                              <div
                                key={vacation.id}
                                className={`bg-gradient-to-r ${colorClass} text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-soft cursor-pointer hover:shadow-medium transition-all duration-200 transform hover:scale-105`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditVacation(vacation);
                                }}
                              >
                                <div className="flex items-center space-x-1 truncate">
                                  <MapPin className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                  <span className="font-medium truncate text-xs">
                                    {vacation.description || 'Vacation'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {dayInfo.vacations.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-1 sm:px-2">
                              +{dayInfo.vacations.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Vacation Management */}
          <div className="space-y-6">
            {/* Projected PTO Balance */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200/50 dark:border-primary-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Projected PTO Balance</h3>
              </div>
              <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
                This projection includes your saved vacations and future accruals.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Future Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-white text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                {projectedPTOData && (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-primary-200 dark:border-primary-700">
                      <div className="text-sm text-primary-700 dark:text-primary-300 font-semibold mb-1">
                        On {formatSelectedDate()}
                      </div>
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                        {projectedPTOData.projectedBalance.toFixed(2)} hrs
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ({hoursToDays(projectedPTOData.projectedBalance)} days)
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Starting Balance</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {projectedPTOData.breakdown.startingBalance.toFixed(2)} hrs
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">PTO Accrued</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{projectedPTOData.breakdown.totalAccrued.toFixed(2)} hrs
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>Vacation Hours</span>
                        </span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          -{projectedPTOData.breakdown.totalVacationHours.toFixed(2)} hrs
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-primary-200 dark:border-primary-700">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Final Balance</span>
                          <span className="font-bold text-primary-600 dark:text-primary-400">
                            {projectedPTOData.breakdown.finalBalance.toFixed(2)} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Vacations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Vacations</h3>
                </div>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full font-medium">
                  {upcomingVacations.length}
                </span>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {upcomingVacations.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm">No upcoming vacations</p>
                    <button
                      onClick={handleAddVacation}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium mt-1 transition-colors"
                    >
                      Plan your next getaway
                    </button>
                  </div>
                ) : (
                  upcomingVacations.map((vacation) => (
                    <div 
                      key={vacation.id} 
                      className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-lg hover:shadow-soft cursor-pointer transition-all duration-200"
                      onClick={() => handleEditVacation(vacation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {vacation.description || 'Vacation'}
                          </h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {formatDateRange(vacation.startDate, vacation.endDate)}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500">
                            <span>{vacation.totalHours.toFixed(2)} hrs</span>
                            <span>({hoursToDays(vacation.totalHours)}d)</span>
                            {vacation.includeWeekends && (
                              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded text-xs">
                                +weekends
                              </span>
                            )}
                          </div>
                        </div>
                        <Edit3 className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Past Vacations */}
            {pastVacations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Past Vacations</h3>
                  </div>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium">
                    {pastVacations.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {pastVacations.slice(0, 5).map((vacation) => (
                    <div 
                      key={vacation.id} 
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
                      onClick={() => handleEditVacation(vacation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {vacation.description || 'Vacation'}
                          </h4>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {formatDateRange(vacation.startDate, vacation.endDate)}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {vacation.totalHours.toFixed(2)} hrs ({hoursToDays(vacation.totalHours)}d)
                          </div>
                        </div>
                        <Edit3 className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  ))}
                  
                  {pastVacations.length > 5 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{pastVacations.length - 5} more past vacations
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-6 border border-amber-200/50 dark:border-amber-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Legend</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Future Pay Day (hover/click for details)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 opacity-60 rounded-full flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Past Pay Day</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Vacation Day</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-primary-200 dark:bg-primary-800 border-2 border-primary-400 dark:border-primary-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Today</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Future Pay Day Border</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 bg-gray-50/30 dark:bg-gray-800/10 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Past Pay Day Border</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <strong>Tip:</strong> Click on vacation indicators to edit, or click on any day to add new vacations. Hover or click on pay day dollar icons for detailed balance information.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payday Tooltip */}
      {openTooltipDate && dailyPTOBalances[openTooltipDate] && (
        <PaydayTooltip
          dayInfo={dailyPTOBalances[openTooltipDate]}
          position={tooltipPosition}
          onClose={handlePaydayIconLeave}
          hoursToDays={hoursToDays}
          isFuturePayday={isFutureDate(dailyPTOBalances[openTooltipDate].date.getDate())}
        />
      )}

      {/* Vacation Modal */}
      <VacationModal
        isOpen={isAddVacationModalOpen}
        onClose={() => setIsAddVacationModalOpen(false)}
        editingVacation={editingVacation}
        onSave={handleSaveVacation}
        onDelete={handleDeleteVacation}
        initialStartDate={modalInitialDates.startDate}
        initialEndDate={modalInitialDates.endDate}
        userSettings={userSettings}
      />
    </div>
  );
}