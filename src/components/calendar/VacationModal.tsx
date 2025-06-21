import React from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { VacationEntry } from '../../types/VacationEntry';

interface VacationFormData {
  startDate: string;
  endDate: string;
  includeWeekends: boolean;
  description: string;
}

interface VacationModalProps {
  isAddVacationModalOpen: boolean;
  setIsAddVacationModalOpen: (open: boolean) => void;
  editingVacation: VacationEntry | null;
  vacationForm: VacationFormData;
  setVacationForm: React.Dispatch<React.SetStateAction<VacationFormData>>;
  handleSaveVacation: () => void;
  handleDeleteVacation: (vacationId: string) => void;
  calculateFormHours: () => number;
  hoursToDays: (hours: number) => string;
}

export default function VacationModal({
  isAddVacationModalOpen,
  setIsAddVacationModalOpen,
  editingVacation,
  vacationForm,
  setVacationForm,
  handleSaveVacation,
  handleDeleteVacation,
  calculateFormHours,
  hoursToDays
}: VacationModalProps) {
  if (!isAddVacationModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingVacation ? 'Edit Vacation' : 'Add Vacation'}
            </h3>
            <button
              onClick={() => setIsAddVacationModalOpen(false)}
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

            {vacationForm.startDate && vacationForm.endDate && (
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4 rounded-lg border border-primary-200/50 dark:border-primary-700/50">
                <div className="text-center">
                  <div className="text-sm text-primary-700 dark:text-primary-300 font-semibold mb-1">
                    Total PTO Required
                  </div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
                    {calculateFormHours().toFixed(2)} hours
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ({hoursToDays(calculateFormHours())} days)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {editingVacation && (
              <button
                onClick={() => handleDeleteVacation(editingVacation.id)}
                className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            
            <div className="flex items-center space-x-3 ml-auto">
              <button
                onClick={() => setIsAddVacationModalOpen(false)}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVacation}
                disabled={!vacationForm.startDate || !vacationForm.endDate}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-soft hover:shadow-medium flex items-center space-x-2"
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