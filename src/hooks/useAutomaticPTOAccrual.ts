import { useEffect } from 'react';
import { UserSettings } from '../types/UserSettings';
import { updatePTOBalanceForTimePassed } from '../utils/dateUtils';

/**
 * Hook that automatically updates PTO balance based on time passed since last visit
 */
export function useAutomaticPTOAccrual(
  userSettings: UserSettings,
  onUpdateSettings: (settings: Partial<UserSettings>) => void
) {
  useEffect(() => {
    const updatePTOBalance = () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Only update if we have valid settings and it's been at least a day since last update
      if (
        userSettings.lastAccrualUpdateDate &&
        userSettings.lastKnownPTOBalance !== undefined &&
        userSettings.lastAccrualUpdateDate !== todayString
      ) {
        const result = updatePTOBalanceForTimePassed(
          userSettings.lastKnownPTOBalance,
          userSettings.lastAccrualUpdateDate,
          today,
          userSettings.accrualRate,
          userSettings.payPeriod,
          userSettings.vacations
        );
        
        // Only update if there's a meaningful change (more than 0.01 hours difference)
        if (Math.abs(result.newBalance - userSettings.currentPTO) > 0.01) {
          console.log('Automatic PTO Update:', {
            previousBalance: userSettings.lastKnownPTOBalance,
            accruedHours: result.accruedHours,
            vacationHoursUsed: result.vacationHoursUsed,
            newBalance: result.newBalance,
            lastUpdate: userSettings.lastAccrualUpdateDate,
            currentDate: todayString
          });
          
          onUpdateSettings({
            currentPTO: result.newBalance,
            lastKnownPTOBalance: result.newBalance,
            lastAccrualUpdateDate: todayString
          });
        } else {
          // Update the date even if balance didn't change significantly
          onUpdateSettings({
            lastAccrualUpdateDate: todayString
          });
        }
      }
    };
    
    // Run the update when the component mounts
    updatePTOBalance();
    
    // Also run when the page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePTOBalance();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userSettings.lastAccrualUpdateDate, userSettings.lastKnownPTOBalance, userSettings.accrualRate, userSettings.payPeriod, userSettings.vacations, onUpdateSettings]);
}