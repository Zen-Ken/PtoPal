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
        <div className="relative w-16 h-16 bg-white border-2 border-black rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center overflow-hidden">
          {/* Circular text path */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 64 64"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <defs>
              <path
                id="circle-path"
                d="M 32, 32 m -24, 0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0"
              />
            </defs>
            <text 
              className="text-[4px] font-bold fill-black tracking-wider"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <textPath href="#circle-path" startOffset="0%">
                POWERED BY BOLT.NEW • MADE IN BOLT • 
              </textPath>
            </text>
          </svg>
          
          {/* Center "b" logo */}
          <div className="relative z-10 flex items-center justify-center">
            <span className="text-2xl font-black text-black leading-none">
              b
            </span>
          </div>
          
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        </div>
      </a>
    </div>
  );
}