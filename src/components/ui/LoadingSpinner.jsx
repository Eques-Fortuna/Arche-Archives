import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable full-section Loading spinner indicator
 */
const LoadingSpinner = ({ message = 'Loading datasets...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center space-y-4 ${className}`}>
      <Loader2 className="w-10 h-10 text-[var(--color-archive-green)] animate-spin" />
      <span className="text-xs font-bold tracking-widest text-[var(--color-muted-ink)] uppercase animate-pulse">
        {message}
      </span>
    </div>
  );
};

export default LoadingSpinner;
