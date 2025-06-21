import { VacationEntry } from './VacationEntry';

export interface UserSettings {
  currentPTO: number; // Now in hours
  accrualRate: number; // Now in hours per pay period
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  annualAllowance: number; // Now in hours
  startDate: string;
  companyName: string;
  employeeId: string;
  vacations: VacationEntry[]; // Array of vacation entries
}

export const defaultUserSettings: UserSettings = {
  currentPTO: 96, // 12 days * 8 hours = 96 hours
  accrualRate: 13.36, // 1.67 days * 8 hours = 13.36 hours
  payPeriod: 'monthly',
  annualAllowance: 200, // 25 days * 8 hours = 200 hours
  startDate: new Date().toISOString().split('T')[0],
  companyName: '',
  employeeId: '',
  vacations: [] // Initialize with empty array
};