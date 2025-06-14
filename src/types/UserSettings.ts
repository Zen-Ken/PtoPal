export interface UserSettings {
  currentPTO: number;
  accrualRate: number;
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  annualAllowance: number;
  startDate: string;
  companyName: string;
  employeeId: string;
}

export const defaultUserSettings: UserSettings = {
  currentPTO: 12,
  accrualRate: 1.67,
  payPeriod: 'monthly',
  annualAllowance: 25,
  startDate: new Date().toISOString().split('T')[0],
  companyName: '',
  employeeId: ''
};