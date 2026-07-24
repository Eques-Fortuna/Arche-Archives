import React, { forwardRef } from 'react';

/**
 * Reusable Form Input component with ref forwarding
 */
const Input = forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full font-sans text-left">
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold text-[var(--color-archive-green)] uppercase tracking-widest block select-none">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        type={type}
        className={`w-full px-4 py-3 bg-[var(--color-surface)] border ${
          error 
            ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]' 
            : 'border-[var(--color-border)] focus:border-[var(--color-archive-green)]'
        } rounded text-sm text-[var(--color-ink)] placeholder-[var(--color-subtle-ink)]/75 focus:outline-none transition-all ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[11px] text-[var(--color-danger)] font-medium block mt-1">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
