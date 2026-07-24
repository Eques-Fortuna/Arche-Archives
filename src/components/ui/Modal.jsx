import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable, accessible Modal dialog component
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E342D]/40 backdrop-blur-sm transition-opacity cursor-default"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`glass-panel w-full ${maxWidth} rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
          <h3 id="modal-title" className="text-base font-bold text-[var(--color-ink)] font-serif tracking-wide">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--color-muted-ink)] hover:text-[var(--color-ink)] hover:bg-[var(--color-panel)] transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-[var(--color-surface)] text-[var(--color-ink)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
