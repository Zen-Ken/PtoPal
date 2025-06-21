export interface VacationEntry {
  id: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  totalHours: number; // Total PTO hours for the entire vacation
  includeWeekends: boolean; // Whether to count weekends in the vacation days
  description?: string; // Optional description/title for the vacation
  createdAt: string; // ISO timestamp when vacation was created
  updatedAt: string; // ISO timestamp when vacation was last updated
}

export const createVacationEntry = (
  startDate: string,
  endDate: string,
  includeWeekends: boolean,
  description?: string
): Omit<VacationEntry, 'id' | 'createdAt' | 'updatedAt'> => {
  // Calculate total hours based on date range and weekend preference
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalDays = 0;
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    
    if (includeWeekends || !isWeekend) {
      totalDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    startDate,
    endDate,
    totalHours: totalDays * 8, // 8 hours per day
    includeWeekends,
    description
  };
};