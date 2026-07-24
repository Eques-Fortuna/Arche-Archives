import React from 'react';

/**
 * Reusable tab-toggling navigation component
 */
const Tabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-[var(--color-border)] ${className}`}>
      <nav className="flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 focus:outline-none cursor-pointer ${
                active
                  ? 'border-[var(--color-archive-green)] text-[var(--color-archive-green)]'
                  : 'border-transparent text-[var(--color-muted-ink)] hover:text-[var(--color-ink)] hover:border-[var(--color-border)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tabs;
