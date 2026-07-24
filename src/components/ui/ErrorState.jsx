import React from 'react';
import { AlertOctagon } from 'lucide-react';
import Button from './Button';

/**
 * Reusable ErrorState card display with an optional retry callback button
 */
const ErrorState = ({
  title = 'Data telemetry error',
  description = 'Failed to establish connection to system APIs.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`text-center py-16 px-4 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 rounded-3xl space-y-6 ${className}`}>
      <div className="flex justify-center">
        <div className="p-4 rounded-2xl bg-[var(--color-danger)] text-[#FAF6EE]">
          <AlertOctagon className="w-8 h-8" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif tracking-wide">{title}</h3>
        <p className="text-xs sm:text-sm text-[var(--color-muted-ink)] max-w-sm mx-auto leading-relaxed font-serif">
          {description}
        </p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button variant="outline" onClick={onRetry} size="sm" className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5">
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
