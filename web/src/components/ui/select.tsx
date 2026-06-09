import React, { forwardRef, useState, useRef, useEffect } from 'react';

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

    // Sync external value or defaultValue with internal state
    const [currentValue, setCurrentValue] = useState<string>(
      String(props.value ?? props.defaultValue ?? '')
    );

    useEffect(() => {
      if (props.value !== undefined) {
        setCurrentValue(String(props.value));
      }
    }, [props.value]);

    // Handle clicks outside the dropdown to close it
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

      // Trigger the native select onChange event to maintain 100% compatibility
      const targetSelect = selectRef.current;
      if (targetSelect) {
        targetSelect.value = value;
        
        // React tracks input values via value tracker. We need to trigger setter.
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
          // Construct synthetic React change event
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

    // Find active label to display on button
    const selectedOption = options.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : '-- Pilih --';

    return (
      <div className="w-full relative" ref={containerRef}>
        {label && (
          <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {label}
          </label>
        )}
        
        {/* Hidden native select for standard HTML forms and compatibility */}
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

        {/* Custom Dropdown Trigger */}
        <button
          type="button"
          onClick={() => !props.disabled && setIsOpen(!isOpen)}
          disabled={props.disabled}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-light-card border text-sm text-light-text-primary dark:text-dark-text-primary text-left focus:outline-none transition-all duration-200 cursor-pointer dark:bg-dark-bg/40 
            ${
              error
                ? 'border-danger/60 focus:border-danger'
                : isOpen
                ? 'border-primary ring-1 ring-primary/20 dark:border-primary'
                : 'border-light-border hover:border-primary/50 dark:border-dark-border dark:hover:border-primary/40'
            }
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-light-bg/40 dark:bg-dark-bg/20' : ''}
            ${className}`}
        >
          <span className="truncate">{displayLabel}</span>
          
          {/* Custom Chevron icon */}
          <span className={`text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
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
          </span>
        </button>

        {/* Custom Dropdown Options Popover */}
        {isOpen && !props.disabled && (
          <div className="absolute left-0 right-0 z-[100] mt-1 w-full rounded-xl bg-light-card border border-light-border/60 shadow-2xl dark:bg-dark-card dark:border-dark-border/60 py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin">
            {options.map((option) => {
              const isSelected = option.value === currentValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'text-primary font-bold bg-primary/5 dark:bg-primary/10'
                      : 'text-light-text-primary dark:text-dark-text-secondary hover:bg-light-bg/80 dark:hover:bg-dark-bg/30 hover:text-light-text-primary dark:hover:text-dark-text-primary'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-primary shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}

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
