import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, DollarSign, Plus, X, Edit3, Trash2, MapPin, Save, Calculator, Target, Info, Navigation } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import PaydayTooltip from './PaydayTooltip';
import LegendTooltip from './LegendTooltip';
import VacationModal from './VacationModal';
import { 
  calculatePTOForTargetDate, 
  getVacationsForDate, 
  generateVacationId, 
  formatDateRange,
  calculateVacationHours,
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
  // Initialize currentDate based on selectedDate if available, but only once
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) {
      const selected = createDateFromString(selectedDate);
      return new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    return new Date();
  });
  
  const [isAddVacationModalOpen, setIsAddVacationModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationEntry | null>(null);
  const [openTooltipDate, setOpenTooltipDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isLegendTooltipOpen, setIsLegendTooltipOpen] = useState(false);
  const [legendTooltipPosition, setLegendTooltipPosition] = useState({ top: 0, left: 0 });
  const [modalInitialDates, setModalInitialDates] = useState({ startDate: '', endDate: '' });
  const [hasInitializedFromSelectedDate, setHasInitializedFromSelectedDate] = useState(false);
  
  // Ref to store day element references
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const payPeriodOptions = {
    weekly: { days: 7, label: 'Weekly' },
    biweekly: { days: 14, label: 'Bi-weekly' },
    semimonthly: { days: 15, label: 'Semi-monthly' }, // Approximate
    monthly: { days: 'end-of-month', label: 'Monthly' } // End of month
  };

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number) => (hours / 8).toFixed(2);

  // Helper functions - moved before useMemo hooks that use them
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Legend items configuration
  const legendItems = useMemo(() => [
    {
      type: 'icon' as const,
      icon: DollarSign,
      iconColor: 'bg-gradient-to-r from-emerald-500 to-green-600',
      description: 'Future Pay Day (hover/click for details)'
    },
    {
      type: 'icon' as const,
      icon: DollarSign,
      iconColor: 'bg-gradient-to-r from-gray-400 to-gray-500 opacity-60',
      description: 'Past Pay Day'
    },
    {
      type: 'color' as const,
      colorClass: 'bg-gradient-to-r from-purple-500 to-pink-600',
      description: 'Vacation Day'
    },
    {
      type: 'border' as const,
      borderClass: 'bg-primary-200 dark:bg-primary-800 border-2 border-primary-400 dark:border-primary-600',
      description: 'Today'
    },
    {
      type: 'border' as const,
      borderClass: 'border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10',
      description: 'Future Pay Day Border'
    },
    {
      type: 'border' as const,
      borderClass: 'border-2 border-gray-400 dark:border-gray-500 bg-gray-50/30 dark:bg-gray-800/10',
      description: 'Past Pay Day Border'
    }
  ], []);

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

  // Effect to handle initial navigation to selected date (only once)
  useEffect(() => {
    if (!selectedDate || hasInitializedFromSelectedDate) return;

    const selectedDateObj = createDateFromString(selectedDate);
    const selectedMonth = selectedDateObj.getMonth();
    const selectedYear = selectedDateObj.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // If selected date is not in the currently displayed month, navigate to it
    if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
      setCurrentDate(new Date(selectedYear, selectedMonth, 1));
    }
    
    setHasInitializedFromSelectedDate(true);
  }, [selectedDate]); // Only depend on selectedDate, not currentDate

  // Callback ref function to store day element references
  const setDayRef = (dateKey: string) => (element: HTMLDivElement | null) => {
    if (element) {
      dayRefs.current.set(dateKey, element);
    } else {
      dayRefs.current.delete(dateKey);
    }
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

  // Function to navigate to a vacation's month and highlight it
  const navigateToVacation = (vacation: VacationEntry) => {
    const vacationStartDate = createDateFromString(vacation.startDate);
    const vacationMonth = vacationStartDate.getMonth();
    const vacationYear = vacationStartDate.getFullYear();
    
    // Navigate to the vacation's month
    setCurrentDate(new Date(vacationYear, vacationMonth, 1));
    
    // Optional: Set the vacation start date as selected date for highlighting
    setSelectedDate(vacation.startDate);
    
    // Scroll the vacation into view after a short delay to allow calendar to render
    setTimeout(() => {
      const dateKey = vacation.startDate;
      const dayElement = dayRefs.current.get(dateKey);
      if (dayElement) {
        dayElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        
        // Add a temporary highlight effect
        dayElement.classList.add('ring-4', 'ring-primary-400', 'ring-opacity-75');
        setTimeout(() => {
          dayElement.classList.remove('ring-4', 'ring-primary-400', 'ring-opacity-75');
        }, 2000);
      }
    }, 100);
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

  const handleLegendIconHover = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Position tooltip to the left of the icon to avoid going off-screen
    setLegendTooltipPosition({
      top: rect.bottom + scrollTop + 8,
      left: Math.max(16, rect.right + scrollLeft - 400) // Position to the left
    });
    setIsLegendTooltipOpen(true);
  };

  const handleLegendIconLeave = () => {
    setIsLegendTooltipOpen(false);
  };

  const handleLegendTooltipMouseEnter = () => {
    setIsLegendTooltipOpen(true);
  };

  const handleLegendTooltipMouseLeave = () => {
    setIsLegendTooltipOpen(false);
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
      setModalInitialDates({ startDate: '', endDate: '' }); // Clear initial dates when editing
    } else {
      // Add new vacation
      setEditingVacation(null);
      setModalInitialDates({ startDate: dateKey, endDate: dateKey });
    }
    setIsAddVacationModalOpen(true);
  };

  const handleAddVacation = () => {
    setEditingVacation(null);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setModalInitialDates({ startDate: todayKey, endDate: todayKey });
    setIsAddVacationModalOpen(true);
  };

  const handleEditVacation = (vacation: VacationEntry) => {
    setEditingVacation(vacation);
    setModalInitialDates({ startDate: '', endDate: '' }); // Clear initial dates when editing
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
    
    setIsAddVacationModalOpen(false);
    setEditingVacation(null);
  };

  const handleDeleteVacation = (vacationId: string) => {
    const updatedVacations = userSettings.vacations.filter(vacation => vacation.id !== vacationId);
    onUpdateSettings({ vacations: updatedVacations });
    setIsAddVacationModalOpen(false);
    setEditingVacation(null);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PTO Calendar</h1>
                <p className="text-gray-600 dark:text-gray-400">Track your pay periods and plan vacations</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddVacation}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vacation</span>
              </button>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 relative">
              {/* Legend Icon */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onMouseEnter={handleLegendIconHover}
                  onMouseLeave={handleLegendIconLeave}
                  className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-soft hover:shadow-medium group"
                  title="Calendar Legend"
                >
                  <Info className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
                </button>
              </div>

              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
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
                      ref={setDayRef(dateKey)}
                      onClick={() => handleDayClick(day)}
                      className={`p-2 h-32 border-2 rounded-lg relative transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        todayClass 
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600 ring-2 ring-primary-200 dark:ring-primary-700' 
                          : dayInfo?.isPayDay
                          ? isFuture
                            ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10'
                            : 'border-gray-400 dark:border-gray-500 bg-gray-50/30 dark:bg-gray-800/10'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        todayClass ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day}
                      </div>
                      
                      {/* Pay Day Dollar Icon */}
                      {dayInfo?.isPayDay && dayInfo.totalPTOOnPayDay !== undefined && (
                        <div className="absolute top-2 right-2">
                          <button
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                              isFuture 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-soft hover:shadow-medium' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 opacity-60'
                            }`}
                            onMouseEnter={(e) => handlePaydayIconHover(e, dateKey)}
                            onMouseLeave={handlePaydayIconLeave}
                            onClick={(e) => handlePaydayIconClick(e, dateKey)}
                            title="Pay Day - Click for details"
                          >
                            <DollarSign className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}

                      {/* Individual Vacation Indicators */}
                      {dayInfo?.vacations && dayInfo.vacations.length > 0 && (
                        <div className="space-y-1 mt-6">
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
                                className={`bg-gradient-to-r ${colorClass} text-white text-xs px-2 py-1 rounded-md shadow-soft cursor-pointer hover:shadow-medium transition-all duration-200 transform hover:scale-105`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditVacation(vacation);
                                }}
                              >
                                <div className="flex items-center space-x-1 truncate">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="font-medium truncate">
                                    {vacation.description || 'Vacation'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {dayInfo.vacations.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
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
                      className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-lg hover:shadow-soft transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
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
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigateToVacation(vacation)}
                          className="flex-1 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 group-hover:scale-105"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>View on Calendar</span>
                        </button>
                        <button
                          onClick={() => handleEditVacation(vacation)}
                          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-all duration-200 group-hover:scale-105"
                          title="Edit vacation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
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
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-2">
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
                      </div>
                      
                      {/* Action Buttons for Past Vacations */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigateToVacation(vacation)}
                          className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 group-hover:scale-105"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleEditVacation(vacation)}
                          className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-all duration-200 group-hover:scale-105"
                          title="Edit vacation"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
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

      {/* Legend Tooltip */}
      <LegendTooltip
        isOpen={isLegendTooltipOpen}
        position={legendTooltipPosition}
        onClose={handleLegendIconLeave}
        onMouseEnter={handleLegendTooltipMouseEnter}
        onMouseLeave={handleLegendTooltipMouseLeave}
        legendItems={legendItems}
      />

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