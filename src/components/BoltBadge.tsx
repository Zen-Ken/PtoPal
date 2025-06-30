import React from 'react';

interface BoltBadgeProps {
  className?: string;
}

export default function BoltBadge({ className = '' }: BoltBadgeProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <a 
        href="https://bolt.new" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group relative block"
        aria-label="Built with Bolt"
      >
        <div className="relative transition-all duration-300 transform hover:scale-105">
          <img 
            src="/white_circle_360x360.png"
            alt="Powered by Bolt.new - Made in Bolt"
            className="w-20 h-20 shadow-large hover:shadow-xl transition-shadow duration-300 rounded-full"
          />
          
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          
          {/* Dark mode glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-300 rounded-full opacity-0 dark:group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
        </div>
      </a>
    </div>
  );
}