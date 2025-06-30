import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, X, Clock, TrendingUp, Calendar } from 'lucide-react';

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
  isFuturePayday: boolean;
}

export default function PaydayTooltip({ dayInfo, position, onClose, hoursToDays, isFuturePayday }: PaydayTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to stay within viewport boundaries
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newTop = position.top;
    let newLeft = position.left;

    // Adjust horizontal position
    if (newLeft + rect.width > viewportWidth - 16) {
      newLeft = viewportWidth - rect.width - 16;
    }
    if (newLeft < 16) {
      newLeft = 16;
    }

    // Adjust vertical position
    if (newTop + rect.height > viewportHeight - 16) {
      newTop = position.top - rect.height - 16; // Position above the trigger
    }
    if (newTop < 16) {
      newTop = 16;
    }

    setAdjustedPosition({ top: newTop, left: newLeft });
  }, [position]);

  // Handle escape key to close tooltip
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!dayInfo.isPayDay || dayInfo.totalPTOOnPayDay === undefined) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 min-w-[320px] max-w-[400px] font-sans"
        style={{
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          fontSize: '14px',
          lineHeight: '1.5',
        }}
        role="dialog"
        aria-labelledby="payday-tooltip-title"
        aria-describedby="payday-tooltip-content"
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          aria-label="Close payday details"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-soft ${
              isFuturePayday 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}>
              {isFuturePayday ? (
                <DollarSign className="w-6 h-6 text-white" />
              ) : (
                <Clock className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 
                id="payday-tooltip-title"
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                {isFuturePayday ? 'Pay Day Details' : 'Past Pay Day'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {dayInfo.date.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div id="payday-tooltip-content" className="space-y-4">
            {/* PTO Balance Section */}
            <div className={`p-4 rounded-xl border-2 ${
              isFuturePayday 
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-200 dark:border-emerald-700'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="text-center">
                <div className={`text-sm font-bold mb-2 ${
                  isFuturePayday 
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  PTO Balance on This Date
                </div>
                {isFuturePayday ? (
                  <>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-1">
                      {dayInfo.totalPTOOnPayDay.toFixed(2)} hrs
                    </div>
                    <div className="text-base text-gray-700 dark:text-gray-300 font-medium">
                      ({hoursToDays(dayInfo.totalPTOOnPayDay)} days)
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                    This was a past pay day
                  </div>
                )}
              </div>
            </div>

            {/* Accrual Details - Only show for future pay days */}
            {isFuturePayday && dayInfo.ptoAccrued && (
              <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="font-bold text-gray-900 dark:text-white">Accrual Details</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">PTO Accrued This Period</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      +{dayInfo.ptoAccrued.toFixed(2)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Equivalent Days</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      +{hoursToDays(dayInfo.ptoAccrued)} days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Information Note */}
            <div className={`text-sm p-4 rounded-lg border ${
              isFuturePayday 
                ? 'text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  isFuturePayday ? 'bg-emerald-500' : 'bg-gray-500'
                }`}></div>
                <div className="font-medium leading-relaxed">
                  {isFuturePayday ? (
                    <>
                      <strong>Projection Note:</strong> This shows your estimated PTO balance on this pay day, 
                      including all accruals and vacation deductions up to this date. Actual balance may vary 
                      based on company policies and any manual adjustments.
                    </>
                  ) : (
                    <>
                      <strong>Historical Note:</strong> This was a past pay day. Your current balance reflects 
                      all accruals and deductions since this date.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility instructions for screen readers */}
        <div className="sr-only">
          Press Escape key or click outside to close this dialog. 
          Use Tab to navigate through interactive elements.
        </div>
      </div>
    </>
  );
}