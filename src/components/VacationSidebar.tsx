import React from 'react';
import { MapPin, Clock, TrendingUp, Edit3 } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import { formatDateRange, createDateFromString } from '../utils/dateUtils';

interface VacationSidebarProps {
  userSettings: UserSettings;
  hoursToDays: (hours: number) => string;
  handleAddVacation: () => void;
  handleEditVacation: (vacation: VacationEntry) => void;
}

export default function VacationSidebar({
  userSettings,
  hoursToDays,
  handleAddVacation,
  handleEditVacation
}: VacationSidebarProps) {
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
            <span className="text-sm text-gray-700 dark:text-gray-300">Vacation Period</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-primary-200 dark:bg-primary-800 border-2 border-primary-400 dark:border-primary-600 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Today</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <strong>Tip:</strong> Click on vacation badges to edit, or click on any day to add new vacations
          </div>
        </div>
      </div>
    </div>
  );
}