import { VacationEntry } from './VacationEntry';

export interface UserSettings {
  currentPTO: number; // Now in hours
  accrualRate: number; // Now in hours per pay period
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  paydayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  annualAllowance: number; // Now in hours
  startDate: string;
  vacations: VacationEntry[]; // Array of vacation entries
  lastAccrualUpdateDate: string; // ISO date string for tracking when PTO was last updated
  lastKnownPTOBalance: number; // The PTO balance at the lastAccrualUpdateDate
}

export const defaultUserSettings: UserSettings = {
  currentPTO: 96.00, // 12 days * 8 hours = 96 hours
  accrualRate: 13.36, // 1.67 days * 8 hours = 13.36 hours
  payPeriod: 'monthly',
  paydayOfWeek: 5, // Friday
  annualAllowance: 200.00, // 25 days * 8 hours = 200 hours
  startDate: new Date().toISOString().split('T')[0],
  vacations: [], // Initialize with empty array
  lastAccrualUpdateDate: new Date().toISOString().split('T')[0], // Today's date
  lastKnownPTOBalance: 96.00 // Same as currentPTO initially
};