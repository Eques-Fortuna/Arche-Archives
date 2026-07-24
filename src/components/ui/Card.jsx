import React from 'react';

/**
 * Reusable Card component for dashboard grids and widgets
 */
const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-panel rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-2xl relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-b border-[var(--color-border)] pb-4 mb-4 flex justify-between items-center ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-lg font-bold text-[var(--color-ink)] ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-t border-[var(--color-border)] pt-4 mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
