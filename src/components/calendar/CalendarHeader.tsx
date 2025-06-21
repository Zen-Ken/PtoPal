import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  navigateMonth: (direction: 'prev' | 'next') => void;
  monthNames: string[];
  onAddVacation: () => void;
}

export default function CalendarHeader({ 
  currentDate, 
  navigateMonth, 
  monthNames, 
  onAddVacation 
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onAddVacation}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vacation</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
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
  );
}