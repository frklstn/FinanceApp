'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD or YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  showTime?: boolean; // If true, behaves like datetime-local, otherwise date
}

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function DatePicker({
  label,
  value,
  onChange,
  disabled = false,
  error,
  showTime = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar state
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-11
  
  // Selected states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedYear(parsedDate.getFullYear());
        setSelectedMonth(parsedDate.getMonth());
        setSelectedDay(parsedDate.getDate());
        setSelectedHour(parsedDate.getHours());
        setSelectedMinute(parsedDate.getMinutes());

        // Keep view in sync
        setViewYear(parsedDate.getFullYear());
        setViewMonth(parsedDate.getMonth());
      }
    }
  }

  // Click outside listener
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

  // Format date for display button
  const getDisplayValue = () => {
    if (!value) return '-- Pilih Tanggal --';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;

    const day = String(d.getDate()).padStart(2, '0');
    const month = INDO_MONTHS[d.getMonth()].substring(0, 3);
    const year = d.getFullYear();

    if (showTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    }
    return `${day} ${month} ${year}`;
  };

  // Helper calendar logic
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // Weekday index of 1st day (0=Sunday)
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Set the selected date and dispatch onChange
  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
  };

  const handleSave = () => {
    // Generate ISO string format
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const dayStr = String(selectedDay).padStart(2, '0');
    const yearStr = String(selectedYear);

    if (showTime) {
      const hourStr = String(selectedHour).padStart(2, '0');
      const minuteStr = String(selectedMinute).padStart(2, '0');
      onChange(`${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}`);
    } else {
      onChange(`${yearStr}-${monthStr}-${dayStr}`);
    }
    setIsOpen(false);
  };

  // Render Calendar Grid Cells
  const renderCalendarCells = () => {
    const cells = [];
    
    // 1. Previous month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push({
        day,
        isCurrentMonth: false,
        key: `prev-${day}`
      });
    }

    // 2. Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        isCurrentMonth: true,
        key: `curr-${day}`
      });
    }

    // 3. Next month padding cells to complete a 6-row grid (42 cells)
    const totalCells = cells.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      cells.push({
        day,
        isCurrentMonth: false,
        key: `next-${day}`
      });
    }

    return cells.map((cell) => {
      const isSelected =
        cell.isCurrentMonth &&
        selectedDay === cell.day &&
        selectedMonth === viewMonth &&
        selectedYear === viewYear;

      return (
        <button
          key={cell.key}
          type="button"
          onClick={() => cell.isCurrentMonth && handleSelectDay(cell.day)}
          disabled={!cell.isCurrentMonth}
          className={`h-9 w-full text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer
            ${
              !cell.isCurrentMonth
                ? 'text-light-text-secondary/20 dark:text-dark-text-secondary/10 cursor-not-allowed'
                : isSelected
                ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20'
                : 'text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg dark:hover:bg-dark-bg/60'
            }
          `}
        >
          {cell.day}
        </button>
      );
    });
  };

  // Render time adjusters
  const adjustHour = (increment: boolean) => {
    setSelectedHour((h) => {
      if (increment) return h === 23 ? 0 : h + 1;
      return h === 0 ? 23 : h - 1;
    });
  };

  const adjustMinute = (increment: boolean) => {
    setSelectedMinute((m) => {
      if (increment) return m === 59 ? 0 : m + 1;
      return m === 0 ? 59 : m - 1;
    });
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1">
          {label}
        </label>
      )}

      {/* Selector Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-light-card border text-sm text-light-text-primary dark:text-dark-text-primary text-left focus:outline-none transition-all duration-200 cursor-pointer dark:bg-dark-bg/40 
          ${
            error
              ? 'border-danger/60 focus:border-danger'
              : isOpen
              ? 'border-primary ring-1 ring-primary/20 dark:border-primary'
              : 'border-light-border hover:border-primary/50 dark:border-dark-border dark:hover:border-primary/40'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-light-bg/40 dark:bg-dark-bg/20' : ''}
        `}
      >
        <CalendarIcon className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary shrink-0" />
        <span className="truncate flex-1">{getDisplayValue()}</span>
      </button>

      {/* Custom Picker Dialog Panel */}
      {isOpen && !disabled && (
        <div className="absolute right-0 left-0 md:left-auto md:w-80 z-[100] mt-1.5 rounded-2xl bg-light-card border border-light-border/60 shadow-2xl dark:bg-dark-card dark:border-dark-border/60 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/60 text-light-text-secondary dark:text-dark-text-secondary cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
              {INDO_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/60 text-light-text-secondary dark:text-dark-text-secondary cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-[10px] font-bold text-light-text-secondary/60 dark:text-dark-text-secondary/60 uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {renderCalendarCells()}
          </div>

          {/* Time Selector Section (Only if showTime is true) */}
          {showTime && (
            <div className="mt-4 pt-4 border-t border-light-border/40 dark:border-dark-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Jam & Waktu
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Hour adjusters */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => adjustHour(true)}
                      className="p-0.5 hover:text-primary cursor-pointer"
                    >
                      ▲
                    </button>
                    <span className="text-sm font-extrabold w-6 text-center text-light-text-primary dark:text-dark-text-primary">
                      {String(selectedHour).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustHour(false)}
                      className="p-0.5 hover:text-primary cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                  
                  <span className="text-sm font-bold text-light-text-secondary">:</span>

                  {/* Minute adjusters */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => adjustMinute(true)}
                      className="p-0.5 hover:text-primary cursor-pointer"
                    >
                      ▲
                    </button>
                    <span className="text-sm font-extrabold w-6 text-center text-light-text-primary dark:text-dark-text-primary">
                      {String(selectedMinute).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustMinute(false)}
                      className="p-0.5 hover:text-primary cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-light-border/30 dark:border-dark-border/30">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10 rounded-lg cursor-pointer transition-colors"
            >
              Hapus
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-light-text-secondary hover:text-light-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary bg-light-bg dark:bg-dark-bg/60 rounded-lg cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm shadow-primary/15 cursor-pointer transition-colors"
              >
                Setel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger font-medium flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
