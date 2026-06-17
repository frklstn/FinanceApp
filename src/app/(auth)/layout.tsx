'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-[#050816] relative overflow-hidden font-sans no-scrollbar">
      {/* Nexus Emerald Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="w-full max-w-lg p-6 z-10">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-4"
          >
            {/* Elegant SVG Logo - Nexus Style */}
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/20 border border-emerald-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                Finance<span className="text-emerald-500">Node</span>
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-1">Wealth Management OS</span>
            </div>
          </motion.div>
        </div>
        
        {children}
      </div>
    </div>
  );
}
