import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2, Calculator, TrendingUp, AlertTriangle, CheckCircle, Info, Clock, Calendar } from 'lucide-react';
import { VacationEntry } from '../types/VacationEntry';
import { UserSettings } from '../types/UserSettings';
import { generateVacationId } from '../utils/dateUtils';
import { 
  validateVacationFormData, 
  haveVacationDatesChanged,
  hoursToDays,
  VacationValidationResult
} from '../utils/vacationValidation';
import { 
  simulatePTOBalanceAcrossVacations,
  VacationSimulationResult
} from '../utils/vacationSimulation';

interface VacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVacation: VacationEntry | null;
  onSave: (vacation: VacationEntry) => void;
  onDelete: (vacationId: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  userSettings: UserSettings;
}

interface VacationFormData {
  startDate: string;
  endDate: string;
  includeWeekends: boolean;
  description: string;
}

export default function VacationModal({
  isOpen,
  onClose,
  editingVacation,
  onSave,
  onDelete,
  initialStartDate = '',
  initialEndDate = '',
  userSettings
}: VacationModalProps) {
  const [vacationForm, setVacationForm] = useState<VacationFormData>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    includeWeekends: false,
    description: ''
  });

  // Store original vacation dates when editing
  const [originalVacationDates, setOriginalVacationDates] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  // Update form when editing vacation changes
  useEffect(() => {
    if (editingVacation) {
      setVacationForm({
        startDate: editingVacation.startDate,
        endDate: editingVacation.endDate,
        includeWeekends: editingVacation.includeWeekends,
        description: editingVacation.description || ''
      });
      // Store original dates for comparison
      setOriginalVacationDates({
        startDate: editingVacation.startDate,
        endDate: editingVacation.endDate
      });
    } else {
      setVacationForm({
        startDate: initialStartDate,
        endDate: initialEndDate,
        includeWeekends: false,
        description: ''
      });
      setOriginalVacationDates(null);
    }
  }, [editingVacation, initialStartDate, initialEndDate]);

  // Real-time validation using the new validation system
  const validation: VacationValidationResult = useMemo(() => {
    return validateVacationFormData(
      {
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        includeWeekends: vacationForm.includeWeekends
      },
      userSettings,
      editingVacation?.id
    );
  }, [vacationForm.startDate, vacationForm.endDate, vacationForm.includeWeekends, userSettings, editingVacation?.id]);

  // Chronological PTO simulation for future conflicts
  const simulationResult: VacationSimulationResult = useMemo(() => {
    // Only run simulation if we have valid dates
    if (!vacationForm.startDate || !vacationForm.endDate) {
      return {
        hasWarnings: false,
        warnings: [],
        simulationSteps: []
      };
    }

    return simulatePTOBalanceAcrossVacations(
      userSettings,
      {
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        includeWeekends: vacationForm.includeWeekends,
        description: vacationForm.description
      },
      editingVacation?.id
    );
  }, [vacationForm.startDate, vacationForm.endDate, vacationForm.includeWeekends, vacationForm.description, userSettings, editingVacation?.id]);

  // Check if vacation dates have changed from original (for conditional validation display)
  const vacationDatesChanged = useMemo(() => {
    return haveVacationDatesChanged(
      { startDate: vacationForm.startDate, endDate: vacationForm.endDate },
      originalVacationDates
    );
  }, [vacationForm.startDate, vacationForm.endDate, originalVacationDates]);

  // Determine if we should show validation results
  const shouldShowValidation = vacationForm.startDate && vacationForm.endDate && vacationDatesChanged;

  // Check if save should be disabled
  const isSaveDisabled = !vacationForm.startDate || !vacationForm.endDate || simulationResult.hasWarnings;

  const handleSave = () => {
    if (!vacationForm.startDate || !vacationForm.endDate || simulationResult.hasWarnings) return;
    
    // Use the validation system's calculated hours
    const totalHours = validation.requiredHours;
    const now = new Date().toISOString();
    
    if (editingVacation) {
      // Update existing vacation
      const updatedVacation: VacationEntry = {
        ...editingVacation,
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        totalHours,
        includeWeekends: vacationForm.includeWeekends,
        description: vacationForm.description,
        updatedAt: now
      };
      onSave(updatedVacation);
    } else {
      // Add new vacation
      const newVacation: VacationEntry = {
        id: generateVacationId(),
        startDate: vacationForm.startDate,
        endDate: vacationForm.endDate,
        totalHours,
        includeWeekends: vacationForm.includeWeekends,
        description: vacationForm.description,
        createdAt: now,
        updatedAt: now
      };
      onSave(newVacation);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (editingVacation) {
      onDelete(editingVacation.id);
      onClose();
    }
  };

  // Get validation icon and color based on result
  const getValidationIcon = () => {
    if (!shouldShowValidation) return null;
    
    switch (validation.messageType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getValidationStyles = () => {
    if (!shouldShowValidation) return '';
    
    switch (validation.messageType) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingVacation ? 'Edit Vacation' : 'Add Vacation'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={vacationForm.description}
                onChange={(e) => setVacationForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Hawaii Trip, Family Visit"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={vacationForm.startDate}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={vacationForm.endDate}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min={vacationForm.startDate}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeWeekends"
                checked={vacationForm.includeWeekends}
                onChange={(e) => setVacationForm(prev => ({ ...prev, includeWeekends: e.target.checked }))}
                className="w-5 h-5 text-primary-600 border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
              />
              <label htmlFor="includeWeekends" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include weekends in PTO calculation
              </label>
            </div>

            {/* Vacation Details Cards */}
            {vacationForm.startDate && vacationForm.endDate && (
              <div className="grid grid-cols-2 gap-4">
                {/* Total PTO Required */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4 rounded-lg border border-primary-200/50 dark:border-primary-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm text-primary-700 dark:text-primary-300 font-semibold">
                      Total PTO Required
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                      {validation.requiredHours.toFixed(2)} hrs
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ({hoursToDays(validation.requiredHours)} days)
                    </div>
                  </div>
                  
                  {/* Breakdown details */}
                  {validation.breakdown.totalDays > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary-200 dark:border-primary-700">
                      <div className="text-xs text-primary-700 dark:text-primary-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Weekdays:</span>
                          <span>{validation.breakdown.weekdayDays} days</span>
                        </div>
                        {validation.breakdown.weekendDays > 0 && (
                          <div className="flex justify-between">
                            <span>Weekends:</span>
                            <span>{validation.breakdown.weekendDays} days {!vacationForm.includeWeekends ? '(excluded)' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Available PTO on Start Date */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                      Available on Start Date
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                      {validation.availableHours.toFixed(2)} hrs
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ({hoursToDays(validation.availableHours)} days)
                    </div>
                  </div>
                  
                  {/* Balance indicator */}
                  <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 text-center">
                      {validation.shortfallHours > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Short by {validation.shortfallHours.toFixed(2)} hrs
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Sufficient balance ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Future Vacation Conflicts Warning */}
            {simulationResult.hasWarnings && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
                      Future Vacation Conflicts Detected
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      This vacation would cause insufficient PTO balance for your future planned vacations:
                    </p>
                    
                    <div className="space-y-3">
                      {simulationResult.warnings.map((warning, index) => (
                        <div key={index} className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 border border-red-200 dark:border-red-700">
                          <div className="flex items-start space-x-3">
                            <Calendar className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-semibold text-red-800 dark:text-red-200 mb-1">
                                {warning.affectedVacationDescription}
                              </div>
                              <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                                {warning.affectedVacationDates}
                              </div>
                              <div className="text-sm text-red-600 dark:text-red-400">
                                <strong>Shortfall:</strong> {warning.shortfallHours.toFixed(2)} hours
                                <br />
                                <strong>Available:</strong> {warning.projectedBalance.toFixed(2)} hours
                                <br />
                                <strong>Required:</strong> {warning.requiredHours.toFixed(2)} hours
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          <strong>Suggestion:</strong> Consider adjusting your vacation dates, reducing the duration, 
                          or modifying your future vacation plans to avoid conflicts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {editingVacation && (
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            
            <div className="flex items-center space-x-3 ml-auto">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaveDisabled}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2 ${
                  isSaveDisabled
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
                title={simulationResult.hasWarnings ? 'Cannot save: Future vacation conflicts detected' : ''}
              >
                <Save className="w-4 h-4" />
                <span>{editingVacation ? 'Update' : 'Save'} Vacation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}