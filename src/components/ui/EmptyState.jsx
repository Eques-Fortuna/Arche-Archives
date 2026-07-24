import React from 'react';
import { Database } from 'lucide-react';

/**
 * Reusable EmptyState component displaying when queries yield zero records
 */
const EmptyState = ({
  title = 'No records found',
  description = 'There are no active records matching this description.',
  icon: Icon = Database,
  className = '',
  action,
}) => {
  return (
    <div className={`text-center py-16 px-4 bg-[var(--color-panel)]/40 border border-[var(--color-border)] rounded-3xl space-y-6 ${className}`}>
      <div className="flex justify-center">
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-archive-green)]">
          <Icon className="w-8 h-8" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-bold text-[var(--color-ink)] font-serif tracking-wide">{title}</h3>
        <p className="text-xs sm:text-sm text-[var(--color-muted-ink)] max-w-sm mx-auto leading-relaxed font-serif">
          {description}
        </p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
