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
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
): number => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  
  if (end <= start) return 0;
  
  let payPeriodsCount = 0;
  
  if (payPeriod === 'semimonthly') {
    // For semi-monthly, count 1st and 15th of each month between dates
    const currentDate = new Date(start);
    currentDate.setDate(1); // Start from first of start month
    
    while (currentDate <= end) {
      // Check if 1st of month is between start and end (exclusive of start, inclusive of end)
      const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      if (firstOfMonth > start && firstOfMonth <= end) {
        payPeriodsCount++;
      }
      
      // Check if 15th of month is between start and end (exclusive of start, inclusive of end)
      const fifteenthOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (fifteenthOfMonth > start && fifteenthOfMonth <= end) {
        payPeriodsCount++;
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else {
    // For other pay periods, calculate based on interval
    const intervalDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30
    }[payPeriod] || 30;
    
    const daysDifference = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    payPeriodsCount = Math.floor(daysDifference / intervalDays);
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
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
): number => {
  const payPeriods = calculatePayPeriodsBetweenDates(startDate, endDate, payPeriod);
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
  vacations: VacationEntry[]
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
  const accruedHours = calculateAccruedPTO(lastUpdate, today, accrualRate, payPeriod);
  
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
  snapshotDate: Date = new Date()
): number => {
  const today = normalizeDate(snapshotDate);
  const target = normalizeDate(targetDate);
  
  // If target date is in the past or today, return current PTO (no vacation deduction)
  if (target <= today) {
    return Math.max(0, Math.round(currentPTOAtSnapshot * 100) / 100);
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
  currentDate: Date = new Date()
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
  const accruedHours = calculateAccruedPTO(today, target, accrualRate, payPeriod);
  
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