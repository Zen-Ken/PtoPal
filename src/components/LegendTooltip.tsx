import React from 'react';
import { DollarSign, MapPin, Info } from 'lucide-react';

interface LegendItem {
  type: 'icon' | 'color' | 'border';
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  colorClass?: string;
  borderClass?: string;
  description: string;
}

interface LegendTooltipProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  legendItems: LegendItem[];
}

export default function LegendTooltip({
  isOpen,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave,
  legendItems
}: LegendTooltipProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-gray-200 dark:border-gray-600 p-4 min-w-[320px] max-w-[400px] transition-all duration-300 ease-out ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
          <Info className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Calendar Legend</h3>
      </div>

      {/* Legend Items */}
      <div className="space-y-3">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Icon or Color Indicator */}
            <div className="flex-shrink-0">
              {item.type === 'icon' && item.icon && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.iconColor}`}>
                  <item.icon className="w-3 h-3 text-white" />
                </div>
              )}
              {item.type === 'color' && (
                <div className={`w-4 h-4 rounded ${item.colorClass}`}></div>
              )}
              {item.type === 'border' && (
                <div className={`w-4 h-4 rounded ${item.borderClass}`}></div>
              )}
            </div>
            
            {/* Description */}
            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.description}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <strong>Tip:</strong> Click on vacation indicators to edit, or click on any day to add new vacations. 
          Hover or click on pay day dollar icons for detailed balance information.
        </div>
      </div>
    </div>
  );
}