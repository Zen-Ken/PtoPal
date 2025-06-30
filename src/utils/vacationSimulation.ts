/**
 * Vacation Simulation System
 * 
 * This module provides chronological PTO balance simulation to detect potential
 * shortfalls when adding or editing vacations that might affect future vacation balances.
 */

import { VacationEntry } from '../types/VacationEntry';
import { UserSettings } from '../types/UserSettings';
import { 
  createDateFromString,
  getProjectedPTOBalance,
  calculateAccruedPTO,
  normalizeDate
} from './dateUtils';

export interface VacationSimulationWarning {
  affectedVacationId: string;
  affectedVacationDescription: string;
  affectedVacationDates: string;
  shortfallHours: number;
  projectedBalance: number;
  requiredHours: number;
  message: string;
}

export interface VacationSimulationResult {
  hasWarnings: boolean;
  warnings: VacationSimulationWarning[];
  simulationSteps: SimulationStep[];
}

interface SimulationStep {
  date: Date;
  vacationId: string;
  vacationDescription: string;
  balanceBeforeVacation: number;
  vacationHours: number;
  balanceAfterVacation: number;
  isShortfall: boolean;
}

/**
 * Creates a temporary vacation entry for simulation purposes
 */
function createTemporaryVacation(
  formData: {
    startDate: string;
    endDate: string;
    includeWeekends: boolean;
    description?: string;
  },
  editingVacationId?: string
): VacationEntry {
  // Calculate vacation hours
  const startDate = createDateFromString(formData.startDate);
  const endDate = createDateFromString(formData.endDate);
  
  let totalDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (formData.includeWeekends || !isWeekend) {
      totalDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const totalHours = totalDays * 8;
  
  return {
    id: editingVacationId || `temp_${Date.now()}`,
    startDate: formData.startDate,
    endDate: formData.endDate,
    totalHours: Math.round(totalHours * 100) / 100,
    includeWeekends: formData.includeWeekends,
    description: formData.description || 'New Vacation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Formats date range for display in warnings
 */
function formatDateRangeForWarning(startDate: string, endDate: string): string {
  const start = createDateFromString(startDate);
  const end = createDateFromString(endDate);
  
  const startFormatted = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  
  if (startDate === endDate) {
    return startFormatted;
  }
  
  const endFormatted = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: end.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Main function to simulate PTO balance across all vacations chronologically
 */
export function simulatePTOBalanceAcrossVacations(
  userSettings: UserSettings,
  newOrEditedVacation: {
    startDate: string;
    endDate: string;
    includeWeekends: boolean;
    description?: string;
  },
  editingVacationId?: string
): VacationSimulationResult {
  const today = new Date();
  const warnings: VacationSimulationWarning[] = [];
  const simulationSteps: SimulationStep[] = [];
  
  // Create temporary vacation entry
  const tempVacation = createTemporaryVacation(newOrEditedVacation, editingVacationId);
  
  // Gather all relevant vacations (existing + new/edited, excluding old version if editing)
  let allVacations: VacationEntry[] = [];
  
  if (editingVacationId) {
    // Replace the existing vacation with the edited version
    allVacations = userSettings.vacations.map(vacation => 
      vacation.id === editingVacationId ? tempVacation : vacation
    );
  } else {
    // Add new vacation to existing ones
    allVacations = [...userSettings.vacations, tempVacation];
  }
  
  // Filter to only future vacations and sort by start date
  const futureVacations = allVacations
    .filter(vacation => {
      const vacationStart = createDateFromString(vacation.startDate);
      return vacationStart >= today;
    })
    .sort((a, b) => {
      const dateA = createDateFromString(a.startDate);
      const dateB = createDateFromString(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });
  
  // If no future vacations, no simulation needed
  if (futureVacations.length === 0) {
    return {
      hasWarnings: false,
      warnings: [],
      simulationSteps: []
    };
  }
  
  // Simulate PTO balance chronologically
  let currentBalance = userSettings.currentPTO;
  let lastSimulatedDate = normalizeDate(today);
  
  for (const vacation of futureVacations) {
    const vacationStartDate = normalizeDate(createDateFromString(vacation.startDate));
    
    // Calculate PTO accrued between last simulated date and this vacation's start
    const accruedSinceLastDate = calculateAccruedPTO(
      lastSimulatedDate,
      vacationStartDate,
      userSettings.accrualRate,
      userSettings.payPeriod,
      userSettings.paydayOfWeek
    );
    
    // Update balance with accrued PTO
    const balanceBeforeVacation = currentBalance + accruedSinceLastDate;
    
    // Check if vacation would cause shortfall
    const balanceAfterVacation = balanceBeforeVacation - vacation.totalHours;
    const isShortfall = balanceAfterVacation < 0;
    
    // Record simulation step
    simulationSteps.push({
      date: vacationStartDate,
      vacationId: vacation.id,
      vacationDescription: vacation.description || 'Vacation',
      balanceBeforeVacation: Math.round(balanceBeforeVacation * 100) / 100,
      vacationHours: vacation.totalHours,
      balanceAfterVacation: Math.round(balanceAfterVacation * 100) / 100,
      isShortfall
    });
    
    // If shortfall detected, create warning
    if (isShortfall) {
      const shortfallHours = Math.abs(balanceAfterVacation);
      
      warnings.push({
        affectedVacationId: vacation.id,
        affectedVacationDescription: vacation.description || 'Vacation',
        affectedVacationDates: formatDateRangeForWarning(vacation.startDate, vacation.endDate),
        shortfallHours: Math.round(shortfallHours * 100) / 100,
        projectedBalance: Math.round(balanceBeforeVacation * 100) / 100,
        requiredHours: vacation.totalHours,
        message: `Your ${vacation.id === tempVacation.id ? 'new' : 'existing'} vacation "${vacation.description || 'Vacation'}" (${formatDateRangeForWarning(vacation.startDate, vacation.endDate)}) would cause a shortfall of ${shortfallHours.toFixed(2)} hours. You'll have ${balanceBeforeVacation.toFixed(2)} hours available but need ${vacation.totalHours.toFixed(2)} hours.`
      });
    }
    
    // Update current balance and last simulated date for next iteration
    currentBalance = Math.max(0, balanceAfterVacation); // Don't allow negative balance
    lastSimulatedDate = vacationStartDate;
  }
  
  return {
    hasWarnings: warnings.length > 0,
    warnings,
    simulationSteps
  };
}

/**
 * Quick check to see if a vacation would cause any future shortfalls
 */
export function wouldVacationCauseFutureShortfalls(
  userSettings: UserSettings,
  vacationData: {
    startDate: string;
    endDate: string;
    includeWeekends: boolean;
    description?: string;
  },
  editingVacationId?: string
): boolean {
  const result = simulatePTOBalanceAcrossVacations(userSettings, vacationData, editingVacationId);
  return result.hasWarnings;
}

/**
 * Get a summary of all potential conflicts for a vacation
 */
export function getVacationConflictSummary(
  userSettings: UserSettings,
  vacationData: {
    startDate: string;
    endDate: string;
    includeWeekends: boolean;
    description?: string;
  },
  editingVacationId?: string
): string {
  const result = simulatePTOBalanceAcrossVacations(userSettings, vacationData, editingVacationId);
  
  if (!result.hasWarnings) {
    return 'No conflicts detected with future vacations.';
  }
  
  const conflictCount = result.warnings.length;
  const totalShortfall = result.warnings.reduce((sum, warning) => sum + warning.shortfallHours, 0);
  
  return `This vacation would cause ${conflictCount} future conflict${conflictCount > 1 ? 's' : ''} with a total shortfall of ${totalShortfall.toFixed(2)} hours.`;
}