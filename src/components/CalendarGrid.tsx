import React, { useMemo } from 'react';
import { DollarSign, MapPin } from 'lucide-react';
import { VacationEntry } from '../types/VacationEntry';
import { getDaysInMonth, getFirstDayOfMonth, createDateFromString } from '../utils/dateUtils';

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

interface VacationSpan {
  vacation: VacationEntry;
  startDay: number;
  endDay: number;
  startCol: number;
  spanCols: number;
  row: number;
  colorIndex: number;
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

  // Calculate vacation spans for the calendar
  const vacationSpans = useMemo(() => {
    const spans: VacationSpan[] = [];
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get all vacations from dailyPTOBalances to ensure we have the right data
    const allVacations = new Map<string, VacationEntry>();
    Object.values(dailyPTOBalances).forEach(dayInfo => {
      dayInfo.vacations.forEach(vacation => {
        allVacations.set(vacation.id, vacation);
      });
    });

    // Filter vacations that overlap with current month
    const monthVacations = Array.from(allVacations.values()).filter(vacation => {
      const vacationStart = createDateFromString(vacation.startDate);
      const vacationEnd = createDateFromString(vacation.endDate);
      return vacationStart <= monthEnd && vacationEnd >= monthStart;
    });

    monthVacations.forEach((vacation, vacationIndex) => {
      const vacationStart = createDateFromString(vacation.startDate);
      const vacationEnd = createDateFromString(vacation.endDate);
      
      // Calculate the start and end days within the current month
      const startDay = Math.max(1, vacationStart.getMonth() === currentDate.getMonth() && vacationStart.getFullYear() === currentDate.getFullYear() ? vacationStart.getDate() : 1);
      const endDay = Math.min(daysInMonth, vacationEnd.getMonth() === currentDate.getMonth() && vacationEnd.getFullYear() === currentDate.getFullYear() ? vacationEnd.getDate() : daysInMonth);
      
      // Calculate grid positions
      const startCol = (startDay + firstDay - 2) % 7;
      const endCol = (endDay + firstDay - 2) % 7;
      const startRow = Math.floor((startDay + firstDay - 2) / 7);
      const endRow = Math.floor((endDay + firstDay - 2) / 7);
      
      // If vacation spans multiple weeks, create multiple spans
      for (let row = startRow; row <= endRow; row++) {
        const rowStartCol = row === startRow ? startCol : 0;
        const rowEndCol = row === endRow ? endCol : 6;
        const spanCols = rowEndCol - rowStartCol + 1;
        
        // Calculate the actual start and end days for this row
        const rowStartDay = row === startRow ? startDay : (row * 7 - firstDay + 2);
        const rowEndDay = row === endRow ? endDay : Math.min(daysInMonth, (row + 1) * 7 - firstDay + 1);
        
        spans.push({
          vacation,
          startDay: rowStartDay,
          endDay: rowEndDay,
          startCol: rowStartCol,
          spanCols,
          row: row + 1, // +1 to account for header row
          colorIndex: vacationIndex
        });
      }
    });
    
    return spans;
  }, [currentDate, dailyPTOBalances, daysInMonth, firstDay]);

  // Color palette for vacation spans
  const vacationColors = [
    'from-purple-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-yellow-600',
    'from-violet-500 to-purple-600'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 p-6 relative">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Container */}
      <div className="relative">
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
                <div className={`text-sm font-medium mb-1 relative z-30 ${
                  todayClass ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                }`}>
                  {day}
                </div>
                
                {/* Pay Day Indicator with Total PTO Balance - Only show for future dates */}
                {dayInfo?.isPayDay && dayInfo.totalPTOOnPayDay !== undefined && isFuture && (
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-2 py-1 rounded-md shadow-soft mb-1 z-30 relative">
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
              </div>
            );
          })}
        </div>

        {/* Vacation Spans Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {vacationSpans.map((span, index) => {
            const colorClass = vacationColors[span.colorIndex % vacationColors.length];
            const cellHeight = 8.5; // rem - height of each calendar cell including gap
            const cellWidth = 14.28571; // percentage - 100% / 7 columns
            
            return (
              <div
                key={`${span.vacation.id}-${span.row}-${span.startCol}`}
                className={`absolute bg-gradient-to-r ${colorClass} text-white text-xs px-2 py-1 rounded-md shadow-soft z-20 pointer-events-auto cursor-pointer hover:shadow-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-1`}
                style={{
                  top: `${span.row * cellHeight + 3.5}rem`, // Adjust based on row height and header
                  left: `${span.startCol * cellWidth}%`,
                  width: `${span.spanCols * cellWidth - 0.5}%`, // Account for gap
                  height: '1.5rem',
                  minWidth: '60px' // Ensure minimum width for readability
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditVacation(span.vacation);
                }}
                title={`${span.vacation.description || 'Vacation'} (${span.vacation.totalHours.toFixed(2)} hrs)`}
              >
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium truncate">
                  {span.vacation.description || 'Vacation'}
                </span>
                {span.spanCols >= 3 && (
                  <span className="text-xs opacity-75 ml-auto">
                    {span.vacation.totalHours.toFixed(1)}h
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}