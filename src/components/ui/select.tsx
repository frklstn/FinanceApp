'use client';

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

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
  ({ className = '', label, options, error, description, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    const [currentValue, setCurrentValue] = useState<string>(
      String(props.value ?? props.defaultValue ?? '')
    );

    useEffect(() => {
      if (props.value !== undefined) {
        setCurrentValue(String(props.value));
      }
    }, [props.value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleOptionClick = (value: string) => {
      setCurrentValue(value);
      setIsOpen(false);

      const targetSelect = selectRef.current;
      if (targetSelect) {
        targetSelect.value = value;
        const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          'value'
        )?.set;
        
        if (nativeSelectValueSetter) {
          nativeSelectValueSetter.call(targetSelect, value);
        }

        const event = new Event('change', { bubbles: true });
        targetSelect.dispatchEvent(event);

        if (onChange) {
          const syntheticEvent = {
            target: targetSelect,
            currentTarget: targetSelect,
            preventDefault: () => {},
            isDefaultPrevented: () => false,
            stopPropagation: () => {},
            isPropagationStopped: () => false,
            persist: () => {},
            nativeEvent: event,
            type: 'change',
            bubbles: true,
            cancelable: false,
          } as unknown as React.ChangeEvent<HTMLSelectElement>;
          
          onChange(syntheticEvent);
        }
      }
    };

    const selectedOption = options.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : '-- Pilih --';

    return (
      <div className="w-full space-y-1.5" ref={containerRef}>
        {label && (
          <label className="block text-xs font-bold text-text-secondary tracking-wide uppercase">
            {label}
          </label>
        )}
        
        <select
          ref={(node) => {
            selectRef.current = node;
            if (ref) {
              if (typeof ref === 'function') ref(node);
              else (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
            }
          }}
          value={currentValue}
          onChange={onChange}
          className="sr-only"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
 
        <div className="relative group">
          <button
            type="button"
            onClick={() => !props.disabled && setIsOpen(!isOpen)}
            disabled={props.disabled}
            className={cn(
              "w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-[var(--bg-main)]/50 backdrop-blur-md border text-sm text-[var(--nexus-text-primary)] text-left focus:outline-none transition-all duration-300 hover:bg-[var(--bg-main)]/80 cursor-pointer",
              error
                ? "border-danger/60"
                : isOpen
                ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : "border-[var(--nexus-glass-border)]",
              props.disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <span className="truncate font-medium">{displayLabel}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("w-4 h-4 text-emerald-400 transition-transform duration-300", isOpen && "rotate-180")}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
 
          {isOpen && !props.disabled && (
            <div className="absolute left-0 right-0 z-[100] mt-2 w-full rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--nexus-glass-border)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300 no-scrollbar">
              {options.map((option) => {
                const isSelected = option.value === currentValue;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={cn(
                      "w-full px-5 py-3 text-xs text-left transition-all duration-200 flex items-center justify-between cursor-pointer group/opt",
                      isSelected
                        ? "text-[var(--nexus-text-primary)] font-black bg-emerald-500/10"
                        : "text-muted-foreground hover:bg-[var(--nexus-bg-panel)] hover:text-[var(--nexus-text-primary)]"
                    )}
                  >
                    <span className="truncate uppercase tracking-wider">{option.label}</span>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
 
        {error && (
          <p className="text-[10px] text-danger font-bold uppercase tracking-tight flex items-center gap-1.5">
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

Select.displayName = 'Select';
