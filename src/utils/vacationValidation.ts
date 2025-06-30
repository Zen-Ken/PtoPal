/**
 * Vacation Request Validation System
 * 
 * This module provides comprehensive validation for vacation requests including:
 * - Automatic hour recalculation when dates change
 * - Balance sufficiency checks
 * - Special weekend handling
 * - Clear validation messages
 */

import { VacationEntry } from '../types/VacationEntry';
import { UserSettings } from '../types/UserSettings';
import { 
  calculateVacationHours, 
  getProjectedPTOBalance, 
  createDateFromString,
  getDaysBetweenDates
} from './dateUtils';

export interface VacationValidationResult {
  isValid: boolean;
  requiredHours: number;
  availableHours: number;
  shortfallHours: number;
  message: string;
  messageType: 'success' | 'warning' | 'error';
  breakdown: {
    totalDays: number;
    weekdayDays: number;
    weekendDays: number;
    hoursFromWeekdays: number;
    hoursFromWeekends: number;
  };
}

export interface WeekendValidationOptions {
  excludeWeekendsFromCalculation: boolean;
  skipWeekendBalanceCheck: boolean;
}

/**
 * Calculates vacation hours with detailed breakdown of weekdays vs weekends
 */
export function calculateVacationHoursWithBreakdown(
  startDateStr: string,
  endDateStr: string,
  includeWeekends: boolean
): VacationValidationResult['breakdown'] {
  const startDate = createDateFromString(startDateStr);
  const endDate = createDateFromString(endDateStr);
  
  let totalDays = 0;
  let weekdayDays = 0;
  let weekendDays = 0;
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    
    totalDays++;
    
    if (isWeekend) {
      weekendDays++;
    } else {
      weekdayDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate hours based on inclusion preference
  const hoursFromWeekdays = weekdayDays * 8;
  const hoursFromWeekends = includeWeekends ? weekendDays * 8 : 0;
  
  return {
    totalDays,
    weekdayDays,
    weekendDays,
    hoursFromWeekdays,
    hoursFromWeekends
  };
}

/**
 * Validates if weekend dates should trigger balance warnings
 */
export function shouldSkipWeekendBalanceCheck(
  startDateStr: string,
  endDateStr: string,
  includeWeekends: boolean
): boolean {
  const breakdown = calculateVacationHoursWithBreakdown(startDateStr, endDateStr, includeWeekends);
  
  // If weekends are not included in calculation and the vacation is only weekends,
  // skip balance verification
  if (!includeWeekends && breakdown.weekdayDays === 0 && breakdown.weekendDays > 0) {
    return true;
  }
  
  return false;
}

/**
 * Gets available PTO balance on a specific date
 */
export function getAvailablePTOOnDate(
  targetDateStr: string,
  userSettings: UserSettings,
  excludeVacationId?: string
): number {
  const targetDate = createDateFromString(targetDateStr);
  const today = new Date();
  
  // Filter out the vacation being edited to avoid double-counting
  const relevantVacations = excludeVacationId 
    ? userSettings.vacations.filter(v => v.id !== excludeVacationId)
    : userSettings.vacations;
  
  // Always calculate projected PTO balance using getProjectedPTOBalance
  const projectedData = getProjectedPTOBalance(
    userSettings.currentPTO,
    userSettings.accrualRate,
    userSettings.payPeriod,
    relevantVacations,
    targetDate,
    today,
    userSettings.paydayOfWeek
  );
  
  return projectedData.projectedBalance;
}

/**
 * Main validation function for vacation requests
 */
export function validateVacationRequest(
  startDateStr: string,
  endDateStr: string,
  includeWeekends: boolean,
  userSettings: UserSettings,
  editingVacationId?: string
): VacationValidationResult {
  // Input validation
  if (!startDateStr || !endDateStr) {
    return {
      isValid: false,
      requiredHours: 0,
      availableHours: 0,
      shortfallHours: 0,
      message: 'Please select both start and end dates',
      messageType: 'error',
      breakdown: {
        totalDays: 0,
        weekdayDays: 0,
        weekendDays: 0,
        hoursFromWeekdays: 0,
        hoursFromWeekends: 0
      }
    };
  }
  
  const startDate = createDateFromString(startDateStr);
  const endDate = createDateFromString(endDateStr);
  
  if (startDate > endDate) {
    return {
      isValid: false,
      requiredHours: 0,
      availableHours: 0,
      shortfallHours: 0,
      message: 'End date must be after start date',
      messageType: 'error',
      breakdown: {
        totalDays: 0,
        weekdayDays: 0,
        weekendDays: 0,
        hoursFromWeekdays: 0,
        hoursFromWeekends: 0
      }
    };
  }
  
  // Calculate vacation hours with detailed breakdown
  const breakdown = calculateVacationHoursWithBreakdown(startDateStr, endDateStr, includeWeekends);
  const requiredHours = breakdown.hoursFromWeekdays + breakdown.hoursFromWeekends;
  
  // Get available PTO on start date
  const availableHours = getAvailablePTOOnDate(startDateStr, userSettings, editingVacationId);
  
  // Check if we should skip weekend balance validation
  const skipWeekendCheck = shouldSkipWeekendBalanceCheck(startDateStr, endDateStr, includeWeekends);
  
  if (skipWeekendCheck) {
    return {
      isValid: true,
      requiredHours,
      availableHours,
      shortfallHours: 0,
      message: 'Weekend vacation request (no PTO hours required)',
      messageType: 'success',
      breakdown
    };
  }
  
  // Calculate shortfall
  const shortfallHours = Math.max(0, requiredHours - availableHours);
  const isValid = shortfallHours === 0;
  
  // Generate appropriate message
  let message: string;
  let messageType: 'success' | 'warning' | 'error';
  
  if (isValid) {
    if (requiredHours === 0) {
      message = 'No PTO hours required for this vacation';
      messageType = 'success';
    } else {
      message = `Vacation request is valid! You have sufficient PTO balance.`;
      messageType = 'success';
    }
  } else {
    if (breakdown.weekendDays > 0 && !includeWeekends) {
      message = `You need ${shortfallHours.toFixed(2)} more hours (weekends excluded from calculation)`;
    } else {
      message = `You need ${shortfallHours.toFixed(2)} more hours for this vacation`;
    }
    messageType = 'error';
  }
  
  return {
    isValid,
    requiredHours: Math.round(requiredHours * 100) / 100,
    availableHours: Math.round(availableHours * 100) / 100,
    shortfallHours: Math.round(shortfallHours * 100) / 100,
    message,
    messageType,
    breakdown
  };
}

/**
 * Real-time validation hook for form inputs
 */
export function validateVacationFormData(
  formData: {
    startDate: string;
    endDate: string;
    includeWeekends: boolean;
  },
  userSettings: UserSettings,
  editingVacationId?: string
): VacationValidationResult {
  return validateVacationRequest(
    formData.startDate,
    formData.endDate,
    formData.includeWeekends,
    userSettings,
    editingVacationId
  );
}

/**
 * Checks if vacation dates have meaningfully changed (for conditional validation display)
 */
export function haveVacationDatesChanged(
  currentDates: { startDate: string; endDate: string },
  originalDates: { startDate: string; endDate: string } | null
): boolean {
  if (!originalDates) return true; // New vacation, always validate
  
  return (
    currentDates.startDate !== originalDates.startDate ||
    currentDates.endDate !== originalDates.endDate
  );
}

/**
 * Formats validation message with additional context
 */
export function formatValidationMessage(
  validation: VacationValidationResult,
  includeBreakdown: boolean = false
): string {
  let message = validation.message;
  
  if (includeBreakdown && validation.breakdown.totalDays > 0) {
    const { breakdown } = validation;
    
    if (breakdown.weekendDays > 0) {
      message += `\n\nBreakdown: ${breakdown.weekdayDays} weekday${breakdown.weekdayDays !== 1 ? 's' : ''}`;
      if (breakdown.weekendDays > 0) {
        message += `, ${breakdown.weekendDays} weekend day${breakdown.weekendDays !== 1 ? 's' : ''}`;
      }
      
      if (breakdown.hoursFromWeekends === 0 && breakdown.weekendDays > 0) {
        message += ' (weekends excluded from PTO calculation)';
      }
    }
  }
  
  return message;
}

/**
 * Utility to convert hours to days for display
 */
export function hoursToDays(hours: number): string {
  return (hours / 8).toFixed(2);
}