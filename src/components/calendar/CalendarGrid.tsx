import React from 'react';
import { DollarSign, MapPin } from 'lucide-react';
import { VacationEntry } from '../../types/VacationEntry';

interface DayInfo {
  date: Date;
  ptoBalance: number;
  isPayDay: boolean;
  vacations: VacationEntry[];
  ptoAccrued?: number;
  totalPTOOnPayDay?: number;
}

interface CalendarGridProps {
  firstDay: number;
  daysInMonth: number;
  dailyPTOBalances: { [key: string]: DayInfo };
  isToday: (day: number) => boolean;
  handleDayClick: (day: number) => void;
  handleEditVacation: (vacation: VacationEntry) => void;
  hoursToDays: (hours: number) => string;
  currentDate: Date;
}

export default function CalendarGrid({
  firstDay,
  daysInMonth,
  dailyPTOBalances,
  isToday,
  handleDayClick,
  handleEditVacation,
  hoursToDays,
  currentDate
}: CalendarGridProps) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Color variations for vacation badges
  const vacationColors = [
    'from-purple-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600',
    'from-rose-500 to-pink-600'
  ];

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
              <div className={`text-sm font-medium mb-1 relative z-20 ${
                todayClass ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
              }`}>
                {day}
              </div>
              
              {/* Pay Day Indicator with Total PTO Balance */}
              {dayInfo?.isPayDay && dayInfo.totalPTOOnPayDay !== undefined && (
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-2 py-1 rounded-md shadow-soft mb-1 relative z-20">
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

              {/* Overlapping Vacation Indicators */}
              {dayInfo?.vacations && dayInfo.vacations.length > 0 && (
                <div className="absolute inset-x-1 bottom-1">
                  {/* Render vacation badges in reverse order so first vacation appears on top */}
                  {dayInfo.vacations.slice(0, 3).reverse().map((vacation, reverseIndex) => {
                    const index = dayInfo.vacations.length - 1 - reverseIndex;
                    const colorClass = vacationColors[index % vacationColors.length];
                    const zIndex = 10 + index; // Higher index = higher z-index (on top)
                    const bottomOffset = index * 3; // 3px offset for each badge
                    
                    return (
                      <div
                        key={vacation.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVacation(vacation);
                        }}
                        className={`absolute inset-x-0 bg-gradient-to-r ${colorClass} text-white text-xs px-2 py-1 rounded-md shadow-soft hover:shadow-medium transition-all duration-200 transform hover:scale-105 cursor-pointer`}
                        style={{
                          bottom: `${bottomOffset}px`,
                          zIndex: zIndex
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {vacation.description || 'Vacation'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* "More" indicator if there are more than 3 vacations */}
                  {dayInfo.vacations.length > 3 && (
                    <div 
                      className="absolute inset-x-0 bg-gray-600 dark:bg-gray-500 text-white text-xs px-2 py-1 rounded-md shadow-soft"
                      style={{
                        bottom: `${3 * 3}px`, // Position below the 3rd badge
                        zIndex: 13
                      }}
                    >
                      <div className="text-center font-medium">
                        +{dayInfo.vacations.length - 3} more
                      </div>
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