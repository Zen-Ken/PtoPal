import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, DollarSign, Plus, X, Edit3, Trash2, MapPin, Save, List } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import { 
  calculatePTOForTargetDate, 
  getVacationsForDate, 
  generateVacationId, 
  formatDateRange,
  calculateVacationHours,
  normalizeDate,
  createDateFromString
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
  totalPTOOnPayDay?: number;
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
  const hoursToDays = (hours: number) => (hours / 8).toFixed(2);

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
    
    // For semi-monthly, use 1st and 15th of each month
    if (userSettings.payPeriod === 'semimonthly') {
      // First pay period (1st of month)
      const firstPayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      if (firstPayDate >= startOfMonth && firstPayDate <= endOfMonth) {
        const totalPTO = calculatePTOForTargetDate(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          firstPayDate
        );
        
        events.push({
          date: firstPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(totalPTO * 100) / 100,
          isPayDay: true
        });
      }
      
      // Second pay period (15th of month)
      const secondPayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (secondPayDate >= startOfMonth && secondPayDate <= endOfMonth) {
        const totalPTO = calculatePTOForTargetDate(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          secondPayDate
        );
        
        events.push({
          date: secondPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(totalPTO * 100) / 100,
          isPayDay: true
        });
      }
    } else {
      // For other pay periods, calculate based on interval
      const intervalDays = payPeriodOptions[userSettings.payPeriod as keyof typeof payPeriodOptions]?.days || 30;
      
      // Start from the beginning of the year to find pay periods
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      let currentPayDate = new Date(startOfYear);
      
      while (currentPayDate.getFullYear() === currentDate.getFullYear()) {
        // Check if this pay date falls within the current month
        if (currentPayDate >= startOfMonth && currentPayDate <= endOfMonth) {
          const totalPTO = calculatePTOForTargetDate(
            userSettings.currentPTO,
            userSettings.accrualRate,
            userSettings.payPeriod,
            userSettings.vacations,
            currentPayDate
          );
          
          events.push({
            date: new Date(currentPayDate),
            ptoAccrued: userSettings.accrualRate,
            totalPTO: Math.round(totalPTO * 100) / 100,
            isPayDay: true
          });
        }
        
        currentPayDate.setDate(currentPayDate.getDate() + intervalDays);
      }
    }
    
    return events;
  }, [currentDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod, userSettings.vacations]);

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
      
      // Create a date object for this specific day to check vacations
      const dayDate = new Date(year, month, day);
      const vacationsForDay = getVacationsForDate(dayDate, userSettings.vacations);
      
      balances[dateKey] = {
        date: new Date(currentDay),
        ptoBalance: Math.round(ptoBalance * 100) / 100,
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

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
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
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setVacationForm({
      startDate: todayKey,
      endDate: todayKey,
      includeWeekends: false,
      description: ''
    });
    setIsAddVacationModalOpen(true);
  };

  const handleEditVacation = (vacation: VacationEntry) => {
    setEditingVacation(vacation);
    setVacationForm({
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      includeWeekends: vacation.includeWeekends,
      description: vacation.description || ''
    });
    setIsAddVacationModalOpen(true);
  };

  const handleSaveVacation = () => {
    if (!vacationForm.startDate || !vacationForm.endDate) return;
    
    const totalHours = Math.round(calculateVacationHours(
      vacationForm.startDate,
      vacationForm.endDate,
      vacationForm.includeWeekends
    ) * 100) / 100;
    
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
    return Math.round(calculateVacationHours(
      vacationForm.startDate,
      vacationForm.endDate,
      vacationForm.includeWeekends
    ) * 100) / 100;
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
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

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`p-2 h-32 border border-gray-100 dark:border-gray-700 rounded-lg relative transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        todayClass 
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 ring-2 ring-primary-200 dark:ring-primary-700' 
                          : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        todayClass ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day}
                      </div>
                      
                      {/* Pay Day Indicator with Total PTO Balance */}
                      {dayInfo?.isPayDay && dayInfo.totalPTOOnPayDay !== undefined && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-2 py-1 rounded-md shadow-soft mb-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-medium">Pay Day</span>
                          </div>
                          <div className="text-xs opacity-90 font-medium">
                            {dayInfo.totalPTOOnPayDay.toFixed(2)} hrs total
                          </div>
                          <div className="text-xs opacity-75">
                            ({hoursToDays(dayInfo.totalPTOOnPayDay)}d)
                          </div>
                        </div>
                      )}

                      {/* Individual Vacation Indicators */}
                      {dayInfo?.vacations && dayInfo.vacations.length > 0 && (
                        <div className="space-y-1">
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

            {/* Quick Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200/50 dark:border-primary-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Summary</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Current PTO</span>
                  <div className="text-right">
                    <div className="font-bold text-primary-600 dark:text-primary-400">{userSettings.currentPTO.toFixed(2)} hrs</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">({hoursToDays(userSettings.currentPTO)} days)</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Planned</span>
                  <div className="text-right">
                    <div className="font-bold text-purple-600 dark:text-purple-400">
                      {userSettings.vacations.reduce((sum, v) => sum + v.totalHours, 0).toFixed(2)} hrs
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ({hoursToDays(userSettings.vacations.reduce((sum, v) => sum + v.totalHours, 0))} days)
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-primary-200 dark:border-primary-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Remaining After Vacations</span>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.max(0, userSettings.currentPTO - userSettings.vacations.reduce((sum, v) => sum + v.totalHours, 0)).toFixed(2)} hrs
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        ({hoursToDays(Math.max(0, userSettings.currentPTO - userSettings.vacations.reduce((sum, v) => sum + v.totalHours, 0)))} days)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-6 border border-amber-200/50 dark:border-amber-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Legend</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pay Day + Total PTO Balance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Vacation Day</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-primary-200 dark:bg-primary-800 border-2 border-primary-400 dark:border-primary-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Today</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <strong>Tip:</strong> Click on vacation indicators to edit, or click on any day to add new vacations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vacation Modal */}
      {isAddVacationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingVacation ? 'Edit Vacation' : 'Add Vacation'}
                </h3>
                <button
                  onClick={() => setIsAddVacationModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={vacationForm.description}
                    onChange={(e) => setVacationForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Hawaii Trip, Family Visit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={vacationForm.startDate}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={vacationForm.endDate}
                      onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-5 h-5 text-primary-600 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="includeWeekends" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include weekends in PTO calculation
                  </label>
                </div>

                {vacationForm.startDate && vacationForm.endDate && (
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4 rounded-lg border border-primary-200/50 dark:border-primary-700/50">
                    <div className="text-center">
                      <div className="text-sm text-primary-700 dark:text-primary-300 font-semibold mb-1">
                        Total PTO Required
                      </div>
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                        {calculateFormHours().toFixed(2)} hours
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ({hoursToDays(calculateFormHours())} days)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {editingVacation && (
                  <button
                    onClick={() => handleDeleteVacation(editingVacation.id)}
                    className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                
                <div className="flex items-center space-x-3 ml-auto">
                  <button
                    onClick={() => setIsAddVacationModalOpen(false)}
                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVacation}
                    disabled={!vacationForm.startDate || !vacationForm.endDate}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2"
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