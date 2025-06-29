import React from 'react';
import { DollarSign, X } from 'lucide-react';

interface DayInfo {
  date: Date;
  ptoBalance: number;
  isPayDay: boolean;
  vacations: any[];
  ptoAccrued?: number;
  totalPTOOnPayDay?: number;
}

interface PaydayTooltipProps {
  dayInfo: DayInfo;
  position: { top: number; left: number };
  onClose: () => void;
  hoursToDays: (hours: number) => string;
}

export default function PaydayTooltip({ dayInfo, position, onClose, hoursToDays }: PaydayTooltipProps) {
  if (!dayInfo.isPayDay || dayInfo.totalPTOOnPayDay === undefined) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-large border border-gray-200 dark:border-gray-600 p-4 min-w-[280px] max-w-[320px]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Pay Day Details</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {dayInfo.date.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* PTO Balance */}
      <div className="space-y-3">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
          <div className="text-center">
            <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
              Total PTO Balance
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              {dayInfo.totalPTOOnPayDay.toFixed(2)} hrs
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ({hoursToDays(dayInfo.totalPTOOnPayDay)} days)
            </div>
          </div>
        </div>

        {/* Accrual Details */}
        {dayInfo.ptoAccrued && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">PTO Accrued This Period</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{dayInfo.ptoAccrued.toFixed(2)} hrs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Equivalent Days</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{hoursToDays(dayInfo.ptoAccrued)} days
              </span>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <strong>Note:</strong> This shows your projected PTO balance on this pay day, including all accruals and vacation deductions up to this date.
        </div>
      </div>
    </div>
  );
}