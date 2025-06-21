import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';

interface CalendarPageProps {
  onBack: () => void;
  userSettings: UserSettings;
}

interface PayPeriodEvent {
  date: Date;
  ptoAccrued: number;
  totalPTO: number;
  isPayDay: boolean;
}

export default function CalendarPage({ onBack, userSettings }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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

  const getEventForDate = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return generatePayPeriods.find(event => 
      event.date.getDate() === day &&
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
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
      {/* Bolt Badge - Fixed Position Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative"
        >
          <div className="bg-white border-2 border-black rounded-full p-3 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="w-12 h-12 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs font-bold text-black leading-tight">POWERED BY</div>
                <div className="text-lg font-black text-black leading-none">b</div>
                <div className="text-xs font-bold text-black leading-tight">BOLT.NEW MADE IN BOLT</div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </a>
      </div>

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
                  <p className="text-slate-600">Track your pay periods and PTO balance</p>
                </div>
              </div>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
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
                  <div key={`empty-${index}`} className="p-3 h-24"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const event = getEventForDate(day);
                  const todayClass = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`p-2 h-24 border border-slate-100 rounded-lg relative transition-all duration-200 ${
                        todayClass 
                          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        todayClass ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {day}
                      </div>
                      
                      {event && (
                        <div className="mt-1">
                          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-2 py-1 rounded-md shadow-sm">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-medium">Pay Day</span>
                            </div>
                            <div className="text-xs opacity-90 font-medium">
                              {event.totalPTO.toFixed(0)} hrs
                            </div>
                            <div className="text-xs opacity-75">
                              ({hoursToDays(event.totalPTO)}d)
                            </div>
                          </div>
                        </div>
                      )}
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
                  <span className="text-slate-600">Pay Period</span>
                  <span className="font-bold text-slate-900">
                    {payPeriodOptions[userSettings.payPeriod as keyof typeof payPeriodOptions]?.label || 'Monthly'}
                  </span>
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

            {/* Upcoming Pay Periods */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Upcoming</h3>
              </div>
              
              <div className="space-y-3">
                {generatePayPeriods.slice(0, 3).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900">
                        {event.date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-slate-600">Pay Day</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{event.totalPTO.toFixed(0)} hrs</div>
                      <div className="text-xs text-slate-600">({hoursToDays(event.totalPTO)}d total)</div>
                    </div>
                  </div>
                ))}
                
                {generatePayPeriods.length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    No pay periods this month
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
                  <div className="w-4 h-4 bg-blue-200 border-2 border-blue-400 rounded"></div>
                  <span className="text-sm text-slate-700">Today</span>
                </div>
                <div className="text-xs text-slate-600 mt-3 p-2 bg-slate-100 rounded">
                  <strong>Note:</strong> Hours are displayed with days equivalent (8 hours = 1 day)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}