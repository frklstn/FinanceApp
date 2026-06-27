'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD or YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  showTime?: boolean;
  placeholder?: string;
  className?: string;
}

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

type ViewMode = 'days' | 'months' | 'years';

export function DatePicker({
  label,
  value,
  onChange,
  disabled = false,
  error,
  showTime = false,
  placeholder,
  className
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  
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
        setViewYear(parsedDate.getFullYear());
        setViewMonth(parsedDate.getMonth());
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (!value) return placeholder || 'Pilih Tanggal';
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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrev = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
      else { setViewMonth(viewMonth - 1); }
    } else if (viewMode === 'years') {
      setViewYear(viewYear - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
      else { setViewMonth(viewMonth + 1); }
    } else if (viewMode === 'years') {
      setViewYear(viewYear + 12);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
  };

  const handleSave = () => {
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

  const renderDays = () => {
    const cells = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false, key: `prev-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true, key: `curr-${d}` });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, current: false, key: `next-${d}` });
    }

    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <span key={d} className="text-[10px] font-black text-[var(--nexus-text-muted)]/40 uppercase text-center">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(c => {
            const isSelected = c.current && selectedDay === c.day && selectedMonth === viewMonth && selectedYear === viewYear;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => c.current && handleSelectDay(c.day)}
                className={cn(
                  "h-9 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  !c.current ? "text-[var(--nexus-text-muted)]/10" : isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-[var(--nexus-text-secondary)] hover:bg-[var(--nexus-bg-panel)] hover:text-[var(--nexus-text-primary)]"
                )}
              >
                {c.day}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderMonths = () => (
    <div className="grid grid-cols-3 gap-2 py-4">
      {INDO_MONTHS.map((m, i) => (
        <button
          key={m}
          type="button"
          onClick={() => { setViewMonth(i); setViewMode('days'); }}
          className={cn(
            "py-4 rounded-xl text-xs font-bold transition-all cursor-pointer",
            viewMonth === i ? "bg-emerald-500 text-white" : "text-[var(--nexus-text-muted)] hover:bg-[var(--nexus-bg-panel)] hover:text-[var(--nexus-text-primary)]"
          )}
        >
          {m.substring(0, 3)}
        </button>
      ))}
    </div>
  );

  const renderYears = () => {
    const years = [];
    const startYear = viewYear - 5;
    for (let i = 0; i < 12; i++) { years.push(startYear + i); }
    return (
      <div className="grid grid-cols-3 gap-2 py-4">
        {years.map(y => (
          <button
            key={y}
            type="button"
            onClick={() => { setViewYear(y); setViewMode('months'); }}
            className={cn(
              "py-4 rounded-xl text-xs font-bold transition-all cursor-pointer",
              viewYear === y ? "bg-emerald-500 text-white" : "text-[var(--nexus-text-muted)] hover:bg-[var(--nexus-bg-panel)] hover:text-[var(--nexus-text-primary)]"
            )}
          >
            {y}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("w-full relative", className)} ref={containerRef}>
      {label && <label className="block text-[10px] font-black uppercase text-[var(--nexus-text-muted)]/60 tracking-widest mb-1.5">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--bg-main)]/50 border text-sm text-[var(--nexus-text-primary)] transition-all cursor-pointer backdrop-blur-xl",
          error ? "border-rose-500/50" : isOpen ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-[var(--nexus-glass-border)] hover:border-emerald-500/50"
        )}
      >
        <CalendarIcon className="w-4 h-4 text-emerald-500" />
        <span className="truncate font-bold uppercase tracking-tight">{getDisplayValue()}</span>
        <ChevronDown className={cn("ml-auto w-4 h-4 text-[var(--nexus-text-muted)]/30 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[300px] z-[110] p-5 rounded-[32px] bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] shadow-[0_30px_60px_rgba(0,0,0,0.15)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}
                className="text-sm font-black text-[var(--nexus-text-primary)] uppercase tracking-widest hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {INDO_MONTHS[viewMonth]}
              </button>
              <button 
                type="button" 
                onClick={() => setViewMode('years')}
                className="text-sm font-black text-[var(--nexus-text-muted)] uppercase tracking-widest hover:text-[var(--nexus-text-primary)] transition-colors cursor-pointer"
              >
                {viewYear}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handlePrev} className="p-2 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-bg-panel)]/80 text-[var(--nexus-text-primary)] transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" onClick={handleNext} className="p-2 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-bg-panel)]/80 text-[var(--nexus-text-primary)] transition-all cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="min-h-[220px]">
            {viewMode === 'days' && renderDays()}
            {viewMode === 'months' && renderMonths()}
            {viewMode === 'years' && renderYears()}
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-[var(--nexus-glass-border)]">
            <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] rounded-xl transition-all cursor-pointer tracking-widest border border-[var(--nexus-glass-border)]">Batal</button>
            <button type="button" onClick={handleSave} className="flex-1 py-3 text-[10px] font-black uppercase bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all cursor-pointer tracking-widest">Terapkan</button>
          </div>
        </div>
      )}
    </div>
  );
}
