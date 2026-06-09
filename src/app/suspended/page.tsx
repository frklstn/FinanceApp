'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';

export default function SuspendedPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      {/* Visual background decorations for premium fintech glow */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-danger/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

      <Card className="w-full max-w-lg p-8 md:p-10 text-center space-y-6 glass-card border border-danger/25 relative z-10">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-danger/15 flex items-center justify-center mx-auto border border-danger/20">
          <ShieldAlert className="w-9 h-9 text-danger" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Account Access Suspended
          </h2>
          <p className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Akun Anda ditangguhkan oleh administrator. Akses ke dompet, transaksi, dan fitur keuangan dibatasi sementara.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/30 dark:bg-dark-bg/20 text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary flex items-start gap-3 text-left">
          <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-light-text-primary dark:text-dark-text-primary font-bold">Need assistance?</p>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed">
              If you believe this was an error, please contact platform administration at{' '}
              <a href="mailto:support@financeapp.com" className="text-primary hover:underline">
                support@financeapp.com
              </a>{' '}
              or your account manager.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 cursor-pointer"
            variant="outline"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
