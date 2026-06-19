'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-xl transition-opacity duration-500 ease-out cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="nexus-popup w-full max-w-5xl overflow-hidden text-text-primary relative animate-in fade-in zoom-in-95 duration-300 rounded-3xl border border-border/40 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-border/20 bg-black/[0.02] dark:bg-white/[0.02]">
          <h3 className="text-lg font-bold tracking-tight text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-border/20 hover:bg-border/40 text-text-muted hover:text-text-primary transition-all duration-200 cursor-pointer border border-border/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content body */}
        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
