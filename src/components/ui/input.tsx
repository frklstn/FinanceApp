import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, description, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-text-secondary tracking-wide">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            type={type}
            ref={ref}
            className={`w-full px-5 py-3 rounded-2xl bg-[var(--bg-main)]/50 backdrop-blur-md border text-sm text-text-primary focus:outline-none transition-all duration-300 placeholder:text-text-muted/40 group-hover:bg-[var(--bg-main)]/80 
              ${
                error
                  ? 'border-danger/60 focus:border-danger focus:ring-4 focus:ring-danger/10'
                  : 'border-[var(--nexus-glass-border)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
              } 
              ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-[10px] text-danger font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </p>
        )}
        {!error && description && (
          <p className="text-[10px] text-text-muted font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
