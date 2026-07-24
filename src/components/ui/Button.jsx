import React from 'react';

/**
 * Reusable premium Button component
 * @param {string} [variant=primary] - primary, secondary, danger, ghost, outline
 * @param {string} [size=md] - sm, md, lg
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-sans font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 cursor-pointer rounded';
  
  const variants = {
    primary: 'bg-[#2A473E] hover:bg-[#1E342D] text-[#FAF6EE] shadow-sm hover:shadow border border-[#2A473E]',
    secondary: 'bg-[#FAF6EE] hover:bg-[#F1E7D6] text-[#1A1A1A] border border-[#DED2BE] shadow-sm',
    danger: 'bg-[#8A2D3B] hover:bg-[#6F232E] text-[#FAF6EE] shadow-sm border border-[#8A2D3B]',
    ghost: 'hover:bg-[#F1E7D6]/55 text-[#5F5A52] hover:text-[#1A1A1A]',
    outline: 'bg-transparent hover:bg-[#2A473E]/5 text-[#2A473E] border border-[#2A473E]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-4 py-2.5 text-xs',
    lg: 'px-6 py-3.5 text-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
