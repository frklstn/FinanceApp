import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden font-sans">
      {/* Premium Fintech Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-info/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-success/5 blur-[100px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-md p-4 z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            {/* Elegant SVG Logo resembling floating coins or growing charts */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-info flex items-center justify-center shadow-lg shadow-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
            </div>
            <span className="text-2xl font-bold text-dark-text-primary tracking-tight">
              Finance<span className="text-primary">App</span>
            </span>
          </div>
          <p className="text-sm text-dark-text-secondary font-medium tracking-wide uppercase text-xs">SaaS Personal Wealth Manager</p>
        </div>
        
        {children}
      </div>
    </div>
  );
}
