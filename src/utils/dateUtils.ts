import { VacationEntry } from '../types/VacationEntry';

/**
 * Normalizes a date by setting time components to zero and ensuring consistent timezone handling
 */
export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Creates a date from a date string ensuring consistent parsing
 */
export const createDateFromString = (dateString: string): Date => {
  // Parse the date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Calculates the number of days between two dates, optionally excluding weekends
 */
export const getDaysBetweenDates = (
  start: Date,
  end: Date,
  includeWeekends: boolean = true
): number => {
  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);
  
  if (startDate > endDate) return 0;
  
  let totalDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    
    if (includeWeekends || !isWeekend) {
      totalDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalDays;
};

/**
 * Calculates vacation hours based on start/end dates and weekend preference
 */
export const calculateVacationHours = (
  startDateStr: string,
  endDateStr: string,
  includeWeekends: boolean
): number => {
  const startDate = createDateFromString(startDateStr);
  const endDate = createDateFromString(endDateStr);
  const days = getDaysBetweenDates(startDate, endDate, includeWeekends);
  return days * 8; // 8 hours per day
};

/**
 * Checks if a date falls within a vacation period
 */
export const isDateInVacation = (date: Date, vacation: VacationEntry): boolean => {
  const checkDate = normalizeDate(date);
  const startDate = normalizeDate(createDateFromString(vacation.startDate));
  const endDate = normalizeDate(createDateFromString(vacation.endDate));
  
  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Gets all vacations that affect a specific date
 */
export const getVacationsForDate = (date: Date, vacations: VacationEntry[]): VacationEntry[] => {
  return vacations.filter(vacation => isDateInVacation(date, vacation));
};

/**
 * Calculates PTO balance for a specific target date, accounting for accruals and vacations
 */
export const calculatePTOForTargetDate = (
  currentPTOAtSnapshot: number,
  accrualRate: number,
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  vacations: VacationEntry[],
  targetDate: Date,
  snapshotDate: Date = new Date()
): number => {
  const today = normalizeDate(snapshotDate);
  const target = normalizeDate(targetDate);
  
  // If target date is in the past or today, calculate based on vacations only
  if (target <= today) {
    // Find vacations that have already been taken (end date is before or on today)
    const completedVacations = vacations.filter(vacation => {
      const vacationEnd = normalizeDate(createDateFromString(vacation.endDate));
      return vacationEnd <= today;
    });
    
    const totalVacationHours = completedVacations.reduce((sum, vacation) => sum + vacation.totalHours, 0);
    return Math.max(0, currentPTOAtSnapshot - totalVacationHours);
  }

  // Calculate accruals from today to target date
  const payPeriodOptions = {
    weekly: 7,
    biweekly: 14,
    semimonthly: 15, // Approximate
    monthly: 30 // Approximate
  };

  let payPeriodsCount = 0;
  
  if (payPeriod === 'semimonthly') {
    // For semi-monthly, count 1st and 15th of each month
    const currentDate = new Date(today);
    currentDate.setDate(1); // Start from first of current month
    
    while (currentDate <= target) {
      // Check if 1st of month is between now and target
      if (currentDate >= today && currentDate <= target) {
        payPeriodsCount++;
      }
      
      // Check if 15th of month is between now and target
      const fifteenth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (fifteenth >= today && fifteenth <= target) {
        payPeriodsCount++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else {
    // For other pay periods, calculate based on interval
    const intervalDays = payPeriodOptions[payPeriod] || 30;
    const daysDifference = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    payPeriodsCount = Math.floor(daysDifference / intervalDays);
  }

  const additionalPTO = payPeriodsCount * accrualRate;
  
  // Calculate vacation hours that will be used by the target date
  const vacationsBeforeTarget = vacations.filter(vacation => {
    const vacationEnd = normalizeDate(createDateFromString(vacation.endDate));
    return vacationEnd <= target;
  });
  
  const totalVacationHours = vacationsBeforeTarget.reduce((sum, vacation) => sum + vacation.totalHours, 0);
  
  return Math.max(0, currentPTOAtSnapshot + additionalPTO - totalVacationHours);
};

/**
 * Generates a unique ID for vacation entries
 */
export const generateVacationId = (): string => {
  return `vacation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formats a date range for display
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = createDateFromString(startDate);
  const end = createDateFromString(endDate);
  
  const startFormatted = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  const endFormatted = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  if (startDate === endDate) {
    return startFormatted;
  }
  
  return `${startFormatted} - ${endFormatted}`;
};