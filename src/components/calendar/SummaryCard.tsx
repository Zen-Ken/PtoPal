import React from 'react';
import { TrendingUp } from 'lucide-react';
import { UserSettings } from '../../types/UserSettings';

interface SummaryCardProps {
  userSettings: UserSettings;
  hoursToDays: (hours: number) => string;
}

export default function SummaryCard({ userSettings, hoursToDays }: SummaryCardProps) {
  return (
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
  );
}