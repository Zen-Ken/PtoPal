import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, X, Clock } from 'lucide-react';

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
      
      {/* Minimalized Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-[240px] max-w-[280px] font-sans"
        style={{
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          fontSize: '14px',
          lineHeight: '1.4',
        }}
        role="dialog"
        aria-labelledby="payday-tooltip-title"
        aria-describedby="payday-tooltip-content"
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Close payday details"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isFuturePayday 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}>
              {isFuturePayday ? (
                <DollarSign className="w-4 h-4 text-white" />
              ) : (
                <Clock className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 pr-6">
              <h3 
                id="payday-tooltip-title"
                className="text-sm font-bold text-gray-900 dark:text-white"
              >
                {isFuturePayday ? 'Pay Day' : 'Past Pay Day'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {dayInfo.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* PTO Balance - Simplified */}
          <div id="payday-tooltip-content" className={`p-3 rounded-lg text-center ${
            isFuturePayday 
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
              : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
          }`}>
            {isFuturePayday ? (
              <>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {dayInfo.totalPTOOnPayDay.toFixed(2)} hrs
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  ({hoursToDays(dayInfo.totalPTOOnPayDay)} days available)
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Past pay day
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}