import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200 group"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <Sun className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${
          isDarkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
        }`} />
        <Moon className={`absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300 ${
          isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
        }`} />
      </div>
    </button>
  );
}