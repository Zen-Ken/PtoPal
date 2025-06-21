import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { UserSettings } from '../types/UserSettings';
import { VacationEntry } from '../types/VacationEntry';
import { 
  calculatePTOForTargetDate, 
  getVacationsForDate, 
  generateVacationId, 
  calculateVacationHours,
  createDateFromString
} from '../utils/dateUtils';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import VacationSidebar from './VacationSidebar';
import VacationModal from './VacationModal';

interface CalendarPageProps {
  onBack: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

interface PayPeriodEvent {
  date: Date;
  ptoAccrued: number;
  totalPTO: number;
  isPayDay: boolean;
}

interface DayInfo {
  date: Date;
  ptoBalance: number;
  isPayDay: boolean;
  vacations: VacationEntry[];
  ptoAccrued?: number;
  totalPTOOnPayDay?: number;
}

interface VacationFormData {
  startDate: string;
  endDate: string;
  includeWeekends: boolean;
  description: string;
}

export default function CalendarPage({ onBack, userSettings, onUpdateSettings }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddVacationModalOpen, setIsAddVacationModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationEntry | null>(null);
  const [vacationForm, setVacationForm] = useState<VacationFormData>({
    startDate: '',
    endDate: '',
    includeWeekends: false,
    description: ''
  });
  
  const payPeriodOptions = {
    weekly: { days: 7, label: 'Weekly' },
    biweekly: { days: 14, label: 'Bi-weekly' },
    semimonthly: { days: 15, label: 'Semi-monthly' }, // Approximate
    monthly: { days: 30, label: 'Monthly' } // Approximate
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper function to convert hours to days for display
  const hoursToDays = (hours: number) => (hours / 8).toFixed(2);

  const generatePayPeriods = useMemo(() => {
    const events: PayPeriodEvent[] = [];
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // For semi-monthly, use 1st and 15th of each month
    if (userSettings.payPeriod === 'semimonthly') {
      // First pay period (1st of month)
      const firstPayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      if (firstPayDate >= startOfMonth && firstPayDate <= endOfMonth) {
        const totalPTO = calculatePTOForTargetDate(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          firstPayDate
        );
        
        events.push({
          date: firstPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(totalPTO * 100) / 100,
          isPayDay: true
        });
      }
      
      // Second pay period (15th of month)
      const secondPayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      if (secondPayDate >= startOfMonth && secondPayDate <= endOfMonth) {
        const totalPTO = calculatePTOForTargetDate(
          userSettings.currentPTO,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations,
          secondPayDate
        );
        
        events.push({
          date: secondPayDate,
          ptoAccrued: userSettings.accrualRate,
          totalPTO: Math.round(totalPTO * 100) / 100,
          isPayDay: true
        });
      }
    } else {
      // For other pay periods, calculate based on interval
      const intervalDays = payPeriodOptions[userSettings.payPeriod as keyof typeof payPeriodOptions]?.days || 30;
      
      // Start from the beginning of the year to find pay periods
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      let currentPayDate = new Date(startOfYear);
      
      while (currentPayDate.getFullYear() === currentDate.getFullYear()) {
        // Check if this pay date falls within the current month
        if (currentPayDate >= startOfMonth && currentPayDate <= endOfMonth) {
          const totalPTO = calculatePTOForTargetDate(
            userSettings.currentPTO,
            userSettings.accrualRate,
            userSettings.payPeriod,
            userSettings.vacations,
            currentPayDate
          );
          
          events.push({
            date: new Date(currentPayDate),
            ptoAccrued: userSettings.accrualRate,
            totalPTO: Math.round(totalPTO * 100) / 100,
            isPayDay: true
          });
        }
        
        currentPayDate.setDate(currentPayDate.getDate() + intervalDays);
      }
    }
    
    return events;
  }, [currentDate, userSettings.currentPTO, userSettings.accrualRate, userSettings.payPeriod, userSettings.vacations]);

  // Calculate daily PTO balances for the entire month
  const dailyPTOBalances = useMemo(() => {
    const balances: { [key: string]: DayInfo } = {};
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const currentDay = new Date(startOfMonth);
    while (currentDay <= endOfMonth) {
      // Create a proper date key that matches the calendar day
      const year = currentDay.getFullYear();
      const month = currentDay.getMonth();
      const day = currentDay.getDate();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const ptoBalance = calculatePTOForTargetDate(
        userSettings.currentPTO,
        userSettings.accrualRate,
        userSettings.payPeriod,
        userSettings.vacations,
        new Date(currentDay)
      );
      
      const payPeriodEvent = generatePayPeriods.find(event => 
        event.date.getDate() === currentDay.getDate() &&
        event.date.getMonth() === currentDay.getMonth() &&
        event.date.getFullYear() === currentDay.getFullYear()
      );
      
      // Create a date object for this specific day to check vacations
      const dayDate = new Date(year, month, day);
      const vacationsForDay = getVacationsForDate(dayDate, userSettings.vacations);
      
      balances[dateKey] = {
        date: new Date(currentDay),
        ptoBalance: Math.round(ptoBalance * 100) / 100,
        isPayDay: !!payPeriodEvent,
        vacations: vacationsForDay,
        ptoAccrued: payPeriodEvent?.ptoAccrued,
        totalPTOOnPayDay: payPeriodEvent?.totalPTO
      };
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return balances;
  }, [currentDate, userSettings, generatePayPeriods]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const year = clickedDate.getFullYear();
    const month = clickedDate.getMonth();
    const dayNum = clickedDate.getDate();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayInfo = dailyPTOBalances[dateKey];
    
    if (dayInfo && dayInfo.vacations.length > 0) {
      // Edit existing vacation
      const vacation = dayInfo.vacations[0]; // Edit the first vacation if multiple
      setEditingVacation(vacation);
      setVacationForm({
        startDate: vacation.startDate,
        endDate: vacation.endDate,
        includeWeekends: vacation.includeWeekends,
        description: vacation.description || ''
      });
    } else {
      // Add new vacation
      setEditingVacation(null);
      setVacationForm({
        startDate: dateKey,
        endDate: dateKey,
        includeWeekends: false,
        description: ''
      });
    }
    setIsAddVacationModalOpen(true);
  };

  const handleAddVacation = () => {
    setEditingVacation(null);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setVacationForm({
      startDate: todayKey,
      endDate: todayKey,
      includeWeekends: false,
      description: ''
    });
    setIsAddVacationModalOpen(true);
  };

  const handleEditVacation = (vacation: VacationEntry) => {
    setEditingVacation(vacation);
    setVacationForm({
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      includeWeekends: vacation.includeWeekends,
      description: vacation.description || ''
    });
    setIsAddVacationModalOpen(true);
  };

  const handleSaveVacation = () => {
    if (!vacationForm.startDate || !vacationForm.endDate) return;
    
    const totalHours = Math.round(calculateVacationHours(
      vacationForm.startDate,
      vacationForm.endDate,
      vacationForm.includeWeekends
    ) * 100) / 100;
    
    const now = new Date().toISOString();
    
    if (editingVacation) {
      // Update existing vacation
      const updatedVacations = userSettings.vacations.map(vacation =>
        vacation.id === editingVacation.id
          ? {
              ...vacation,
              startDate: vacationForm.startDate,
              endDate: vacationForm.endDate,
              totalHours,
              includeWeekends: vacationForm.includeWeekends,
              description: vacationForm.description,
              updatedAt: now
            }
          : vacation
      );
      onUpdateSettings({ vacations: updatedVacations });
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
      onUpdateSettings({ vacations: [...userSettings.vacations, newVacation] });
    }
    
    setIsAddVacationModalOpen(false);
    setEditingVacation(null);
  };

  const handleDeleteVacation = (vacationId: string) => {
    const updatedVacations = userSettings.vacations.filter(vacation => vacation.id !== vacationId);
    onUpdateSettings({ vacations: updatedVacations });
    setIsAddVacationModalOpen(false);
    setEditingVacation(null);
  };

  const calculateFormHours = () => {
    if (!vacationForm.startDate || !vacationForm.endDate) return 0;
    return Math.round(calculateVacationHours(
      vacationForm.startDate,
      vacationForm.endDate,
      vacationForm.includeWeekends
    ) * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PTO Calendar</h1>
              <p className="text-gray-600 dark:text-gray-400">Track your pay periods and plan vacations</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <CalendarHeader
            currentDate={currentDate}
            navigateMonth={navigateMonth}
            handleAddVacation={handleAddVacation}
            monthNames={monthNames}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <CalendarGrid
              currentDate={currentDate}
              dailyPTOBalances={dailyPTOBalances}
              isToday={isToday}
              hoursToDays={hoursToDays}
              handleDayClick={handleDayClick}
              handleEditVacation={handleEditVacation}
            />
          </div>

          {/* Sidebar - Vacation Management */}
          <VacationSidebar
            userSettings={userSettings}
            hoursToDays={hoursToDays}
            handleAddVacation={handleAddVacation}
            handleEditVacation={handleEditVacation}
          />
        </div>
      </div>

      {/* Vacation Modal */}
      <VacationModal
        isAddVacationModalOpen={isAddVacationModalOpen}
        editingVacation={editingVacation}
        vacationForm={vacationForm}
        setVacationForm={setVacationForm}
        handleSaveVacation={handleSaveVacation}
        handleDeleteVacation={handleDeleteVacation}
        setIsAddVacationModalOpen={setIsAddVacationModalOpen}
        calculateFormHours={calculateFormHours}
        hoursToDays={hoursToDays}
      />
    </div>
  );
}