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
 * Finds the next occurrence of a specific day of the week on or after a given date
 */
export const getNextDayOfWeek = (startDate: Date, targetDayOfWeek: number): Date => {
  const date = new Date(startDate);
  const currentDayOfWeek = date.getDay();
  const daysUntilTarget = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
  
  if (daysUntilTarget === 0 && date.getTime() === startDate.getTime()) {
    // If it's already the target day and we're looking at the exact start date, return it
    return date;
  }
  
  date.setDate(date.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
  return date;
};

/**
 * Finds the previous occurrence of a specific day of the week on or before a given date
 */
export const getPreviousDayOfWeek = (endDate: Date, targetDayOfWeek: number): Date => {
  const date = new Date(endDate);
  const currentDayOfWeek = date.getDay();
  const daysSinceTarget = (currentDayOfWeek - targetDayOfWeek + 7) % 7;
  
  if (daysSinceTarget === 0) {
    // If it's already the target day, return it
    return date;
  }
  
  date.setDate(date.getDate() - daysSinceTarget);
  return date;
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
  return Math.round(days * 8 * 100) / 100; // 8 hours per day, rounded to 2 decimal places
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
 * Calculates how many pay periods have occurred between two dates
 */
export const calculatePayPeriodsBetweenDates = (
  startDate: Date,
  endDate: Date,
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  paydayOfWeek?: number
): number => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  
  if (end <= start) return 0;
  
  let payPeriodsCount = 0;
  
  if (payPeriod === 'semimonthly') {
    // For semi-monthly, count 15th and last day of each month between dates
    const currentDate = new Date(start);
    currentDate.setDate(1); // Start from first of start month
    
    while (currentDate <= end) {
      // Check if 15th of month is between start and end (exclusive of start, inclusive of end)
      const fifteenthOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (fifteenthOfMonth > start && fifteenthOfMonth <= end) {
        payPeriodsCount++;
      }
      
      // Check if last day of month is between start and end (exclusive of start, inclusive of end)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      if (lastDayOfMonth > start && lastDayOfMonth <= end) {
        payPeriodsCount++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (payPeriod === 'monthly') {
    // For monthly, count last day of each month between dates
    const currentDate = new Date(start);
    currentDate.setDate(1); // Start from first of start month
    
    while (currentDate <= end) {
      // Check if last day of month is between start and end (exclusive of start, inclusive of end)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      if (lastDayOfMonth > start && lastDayOfMonth <= end) {
        payPeriodsCount++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (payPeriod === 'weekly' || payPeriod === 'biweekly') {
    // For weekly and biweekly, use the paydayOfWeek to calculate exact paydays
    if (paydayOfWeek === undefined) {
      paydayOfWeek = 5; // Default to Friday if not specified
    }
    
    const intervalDays = payPeriod === 'weekly' ? 7 : 14;
    
    // Find the first payday on or after the start date
    let currentPayday = getNextDayOfWeek(start, paydayOfWeek);
    
    // If the first payday is exactly on the start date, we need to move to the next one
    // since we want periods between dates (exclusive of start)
    if (currentPayday.getTime() === start.getTime()) {
      currentPayday.setDate(currentPayday.getDate() + intervalDays);
    }
    
    // Count all paydays between start and end (exclusive of start, inclusive of end)
    while (currentPayday <= end) {
      payPeriodsCount++;
      currentPayday.setDate(currentPayday.getDate() + intervalDays);
    }
  }
  
  return payPeriodsCount;
};

/**
 * Calculates PTO accrued between two dates based on pay period and accrual rate
 */
export const calculateAccruedPTO = (
  startDate: Date,
  endDate: Date,
  accrualRate: number,
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  paydayOfWeek?: number
): number => {
  const payPeriods = calculatePayPeriodsBetweenDates(startDate, endDate, payPeriod, paydayOfWeek);
  return Math.round(payPeriods * accrualRate * 100) / 100;
};

/**
 * Calculates total vacation hours used between two dates
 */
export const calculateVacationHoursUsedBetweenDates = (
  startDate: Date,
  endDate: Date,
  vacations: VacationEntry[]
): number => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  
  return vacations.reduce((total, vacation) => {
    const vacationStart = normalizeDate(createDateFromString(vacation.startDate));
    const vacationEnd = normalizeDate(createDateFromString(vacation.endDate));
    
    // Check if vacation overlaps with the date range (exclusive of start, inclusive of end)
    if (vacationEnd > start && vacationStart <= end) {
      return total + vacation.totalHours;
    }
    
    return total;
  }, 0);
};

/**
 * Updates PTO balance based on time passed since last update
 */
export const updatePTOBalanceForTimePassed = (
  lastKnownBalance: number,
  lastUpdateDate: string,
  currentDate: Date,
  accrualRate: number,
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  vacations: VacationEntry[],
  paydayOfWeek?: number
): { newBalance: number; accruedHours: number; vacationHoursUsed: number } => {
  const lastUpdate = normalizeDate(createDateFromString(lastUpdateDate));
  const today = normalizeDate(currentDate);
  
  // If no time has passed, return current balance
  if (today <= lastUpdate) {
    return {
      newBalance: lastKnownBalance,
      accruedHours: 0,
      vacationHoursUsed: 0
    };
  }
  
  // Calculate PTO accrued since last update
  const accruedHours = calculateAccruedPTO(lastUpdate, today, accrualRate, payPeriod, paydayOfWeek);
  
  // Calculate vacation hours used since last update
  const vacationHoursUsed = calculateVacationHoursUsedBetweenDates(lastUpdate, today, vacations);
  
  // Calculate new balance
  const newBalance = Math.max(0, Math.round((lastKnownBalance + accruedHours - vacationHoursUsed) * 100) / 100);
  
  return {
    newBalance,
    accruedHours,
    vacationHoursUsed
  };
};

/**
 * Calculates PTO balance for a specific target date, accounting for accruals only (vacations removed from calculation)
 */
export const calculatePTOForTargetDate = (
  currentPTOAtSnapshot: number,
  accrualRate: number,
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  vacations: VacationEntry[],
  targetDate: Date,
  snapshotDate: Date = new Date(),
  paydayOfWeek?: number
): number => {
  const today = normalizeDate(snapshotDate);
  const target = normalizeDate(targetDate);
  
  // If target date is in the past or today, return current PTO (no vacation deduction)
  if (target <= today) {
    return Math.max(0, Math.round(currentPTOAtSnapshot * 100) / 100);
  }

  let payPeriodsCount = 0;
  
  if (payPeriod === 'semimonthly') {
    // For semi-monthly, count 15th and last day of each month
    const currentDate = new Date(today);
    currentDate.setDate(1); // Start from first of current month
    
    while (currentDate <= target) {
      // Check if 15th of month is between now and target
      const fifteenth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (fifteenth >= today && fifteenth <= target) {
        payPeriodsCount++;
      }
      
      // Check if last day of month is between now and target
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      if (lastDay >= today && lastDay <= target) {
        payPeriodsCount++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (payPeriod === 'monthly') {
    // For monthly, count last day of each month
    const currentDate = new Date(today);
    currentDate.setDate(1); // Start from first of current month
    
    while (currentDate <= target) {
      // Check if last day of month is between now and target
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      if (lastDay >= today && lastDay <= target) {
        payPeriodsCount++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (payPeriod === 'weekly' || payPeriod === 'biweekly') {
    // For weekly and biweekly, use the paydayOfWeek to calculate exact paydays
    if (paydayOfWeek === undefined) {
      paydayOfWeek = 5; // Default to Friday if not specified
    }
    
    const intervalDays = payPeriod === 'weekly' ? 7 : 14;
    
    // Find the first payday on or after today
    let currentPayday = getNextDayOfWeek(today, paydayOfWeek);
    
    // Count all paydays between today and target (inclusive of both)
    while (currentPayday <= target) {
      payPeriodsCount++;
      currentPayday.setDate(currentPayday.getDate() + intervalDays);
    }
  }

  const additionalPTO = Math.round(payPeriodsCount * accrualRate * 100) / 100;
  
  // Return current PTO plus accruals (no vacation deduction)
  return Math.max(0, Math.round((currentPTOAtSnapshot + additionalPTO) * 100) / 100);
};

/**
 * NEW: Calculates projected PTO balance for a future date, accounting for both accruals and vacation deductions
 */
export const getProjectedPTOBalance = (
  currentPTO: number,
  accrualRate: number,
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly',
  vacations: VacationEntry[],
  targetDate: Date,
  currentDate: Date = new Date(),
  paydayOfWeek?: number
): {
  projectedBalance: number;
  accruedHours: number;
  vacationHoursUsed: number;
  breakdown: {
    startingBalance: number;
    totalAccrued: number;
    totalVacationHours: number;
    finalBalance: number;
  };
} => {
  const today = normalizeDate(currentDate);
  const target = normalizeDate(targetDate);
  
  // If target date is in the past or today, return current PTO
  if (target <= today) {
    return {
      projectedBalance: currentPTO,
      accruedHours: 0,
      vacationHoursUsed: 0,
      breakdown: {
        startingBalance: currentPTO,
        totalAccrued: 0,
        totalVacationHours: 0,
        finalBalance: currentPTO
      }
    };
  }

  // Calculate PTO that will be accrued between now and target date
  const accruedHours = calculateAccruedPTO(today, target, accrualRate, payPeriod, paydayOfWeek);
  
  // Calculate vacation hours that will be used between now and target date
  const vacationHoursUsed = calculateVacationHoursUsedBetweenDates(today, target, vacations);
  
  // Calculate final projected balance
  const projectedBalance = Math.max(0, Math.round((currentPTO + accruedHours - vacationHoursUsed) * 100) / 100);
  
  return {
    projectedBalance,
    accruedHours: Math.round(accruedHours * 100) / 100,
    vacationHoursUsed: Math.round(vacationHoursUsed * 100) / 100,
    breakdown: {
      startingBalance: Math.round(currentPTO * 100) / 100,
      totalAccrued: Math.round(accruedHours * 100) / 100,
      totalVacationHours: Math.round(vacationHoursUsed * 100) / 100,
      finalBalance: projectedBalance
    }
  };
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