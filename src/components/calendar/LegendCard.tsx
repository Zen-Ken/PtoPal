import React from 'react';

export default function LegendCard() {
  return (
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
          <strong>Tip:</strong> Click on vacation indicators to edit, or click on any day to add new vacations
        </div>
      </div>
    </div>
  );
}