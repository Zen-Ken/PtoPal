import React from 'react';
import { Clock, Edit3 } from 'lucide-react';
import { VacationEntry } from '../../types/VacationEntry';
import { formatDateRange } from '../../utils/dateUtils';

interface PastVacationsProps {
  pastVacations: VacationEntry[];
  hoursToDays: (hours: number) => string;
  handleEditVacation: (vacation: VacationEntry) => void;
}

export default function PastVacations({
  pastVacations,
  hoursToDays,
  handleEditVacation
}: PastVacationsProps) {
  if (pastVacations.length === 0) {
    return null;
  }

  return (
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
  );
}