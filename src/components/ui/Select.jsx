import React, { forwardRef } from 'react';

/**
 * Reusable Form Select dropdown component with ref forwarding
 */
const Select = forwardRef(({
  label,
  error,
  options = [],
  className = '',
  id,
  placeholder,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full font-sans text-left">
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold text-[var(--color-archive-green)] uppercase tracking-widest block select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          ref={ref}
          className={`w-full px-4 py-3 bg-[var(--color-surface)] border ${
            error 
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]' 
              : 'border-[var(--color-border)] focus:border-[var(--color-archive-green)]'
          } rounded text-sm text-[var(--color-ink)] focus:outline-none transition-all appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {placeholder && <option value="" className="bg-[var(--color-surface)] text-[var(--color-muted-ink)]">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[var(--color-surface)] text-[var(--color-ink)]">
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-muted-ink)]">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-[11px] text-[var(--color-danger)] font-medium block mt-1">{error}</span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
