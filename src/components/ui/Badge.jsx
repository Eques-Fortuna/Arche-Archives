import React from 'react';

/**
 * Reusable metadata Badge tag component
 */
const Badge = ({ children, variant = 'neutral', className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-widest border';
  
  const variants = {
    neutral: 'bg-[var(--color-panel)] text-[var(--color-muted-ink)] border-[var(--color-border)]',
    primary: 'bg-[var(--color-archive-green)] text-[#FAF6EE] border-transparent',
    success: 'bg-[var(--color-success)] text-[#FAF6EE] border-transparent',
    success_soft: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20',
    warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/20',
    danger: 'bg-[var(--color-danger)] text-[#FAF6EE] border-transparent',
    danger_dark: 'bg-[#6F232E] text-[#FAF6EE] border-transparent',
    published: 'bg-[var(--color-archive-green-dark)] text-[#FAF6EE] border-transparent',
    gold: 'bg-[var(--color-antique-gold-soft)] text-[var(--color-antique-gold-dark)] border-[var(--color-antique-gold)]/20',
  };

  return (
    <span className={`${baseStyle} ${variants[variant] || variants.neutral} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
