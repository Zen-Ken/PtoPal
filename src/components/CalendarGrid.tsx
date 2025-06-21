import React from 'react';
import { DollarSign, MapPin } from 'lucide-react';
import { VacationEntry } from '../types/VacationEntry';
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/dateUtils';

interface DayInfo {
  date: Date;
  ptoBalance: number;
  isPayDay: boolean;
  vacations: VacationEntry[];
  ptoAccrued?: number;
  totalPTOOnPayDay?: number;
}

interface CalendarGridProps {
  currentDate: Date;
  dailyPTOBalances: { [key: string]: DayInfo };
  isToday: (day: number) => boolean;
  hoursToDays: (hours: number) => string;
  handleDayClick: (day: number) => void;
  handleEditVacation: (vacation: VacationEntry) => void;
}

export default function CalendarGrid({
  currentDate,
  dailyPTOBalances,
  isToday,
  hoursToDays,
  handleDayClick,
  handleEditVacation
}: CalendarGridProps) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Helper function to check if a date is in the future
  const isFutureDate = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  return (
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
          const isFuture = isFutureDate(day);

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`p-2 h-32 border border-gray-100 dark:border-gray-700 rounded-lg relative transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 overflow-hidden ${
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
              
              {/* Pay Day Indicator with Total PTO Balance - Only show for future dates */}
              {dayInfo?.isPayDay && dayInfo.totalPTOOnPayDay !== undefined && isFuture && (
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-2 py-1 rounded-md shadow-soft mb-1 z-10 relative">
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

              {/* Individual Vacation Badges */}
              {dayInfo?.vacations && dayInfo.vacations.length > 0 && (
                <div className="space-y-1">
                  {dayInfo.vacations.slice(0, 2).map((vacation, vacationIndex) => {
                    const colors = [
                      'from-purple-500 to-pink-600',
                      'from-blue-500 to-indigo-600',
                      'from-green-500 to-emerald-600',
                      'from-orange-500 to-red-600',
                      'from-teal-500 to-cyan-600',
                      'from-rose-500 to-pink-600'
                    ];
                    const colorClass = colors[vacationIndex % colors.length];
                    
                    return (
                      <div
                        key={vacation.id}
                        className={`bg-gradient-to-r ${colorClass} text-white text-xs px-2 py-1 rounded-md shadow-soft cursor-pointer hover:shadow-medium transition-all duration-200 transform hover:scale-105 z-20`}
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
                  
                  {/* Show count if more than 2 vacations */}
                  {dayInfo.vacations.length > 2 && (
                    <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-md text-center">
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
  );
}