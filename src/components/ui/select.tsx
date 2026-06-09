import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  description?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, options, error, description, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-4 py-2.5 rounded-lg bg-light-card border text-sm appearance-none focus:outline-none transition-all duration-200 cursor-pointer dark:bg-dark-bg/40 
              ${
                error
                  ? 'border-danger/60 focus:border-danger'
                  : 'border-light-border focus:border-primary dark:border-dark-border dark:focus:border-primary'
              } 
              ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary">
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom Chevron icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-light-text-secondary dark:text-dark-text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-danger font-medium flex items-center gap-1">
            {error}
          </p>
        )}
        {!error && description && (
          <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary/60">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
