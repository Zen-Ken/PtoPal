import React from 'react';
import { MapPin, Edit3 } from 'lucide-react';
import { VacationEntry } from '../../types/VacationEntry';
import { formatDateRange } from '../../utils/dateUtils';

interface UpcomingVacationsProps {
  upcomingVacations: VacationEntry[];
  hoursToDays: (hours: number) => string;
  handleEditVacation: (vacation: VacationEntry) => void;
  handleAddVacation: () => void;
}

export default function UpcomingVacations({
  upcomingVacations,
  hoursToDays,
  handleEditVacation,
  handleAddVacation
}: UpcomingVacationsProps) {
  return (
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
  );
}