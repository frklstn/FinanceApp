'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setTimeout(() => {
        setErrorMsg(decodeURIComponent(urlError));
      }, 0);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let loginEmail = email.trim();
    let loginPassword = password;
    
    // DEMO Login Protocol Bypass
    if (loginEmail.toUpperCase() === 'DEMO@FRKLSTN') {
      loginEmail = 'demo@frklstn.com';
      loginPassword = 'DEMO@FRKLSTN';
    } else {
      // Standard Validation for Non-Demo
      if (!loginEmail || !loginPassword) {
        setErrorMsg('Protocol Violation: Missing credentials.');
        setLoading(false);
        return;
      }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Authentication Authorized. Redirecting to Node...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'System Failure: Unexpected error.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />
      
      <div className="glass-card p-8 md:p-10 w-full border-white/5 bg-white/[0.01] backdrop-blur-3xl rounded-[32px] shadow-2xl space-y-6">
        {/* Header Removed */}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-[16px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={loading}
                  className="pl-12 rounded-[16px] bg-white/[0.07] border-white/10 py-5 text-xs font-bold tracking-tight h-auto focus:bg-white/[0.1] transition-all text-white placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loading}
                  className="pl-12 pr-12 rounded-[16px] bg-white/[0.07] border-white/10 py-5 text-xs font-bold tracking-tight h-auto focus:bg-white/[0.1] transition-all text-white placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex justify-end px-1">
                <Link href="/forgot-password" className="text-[10px] text-emerald-500/60 hover:text-emerald-400 font-bold uppercase tracking-widest transition-all">
                  Lupa Password?
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-[20px] bg-emerald-500 hover:bg-emerald-600 border-none py-6 text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/10 transition-all active:scale-[0.98]"
          >
            {loading ? 'Authorizing...' : 'Login'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-[20px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] py-6 text-[11px] font-bold uppercase tracking-widest"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })}
          >
            Login dengan Google
          </Button>
        </form>

        <div className="text-center">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Belum punya akun?{' '}
            <Link href="/register" className="text-emerald-500 hover:text-emerald-400 transition-all font-black">
              Buat Akun
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
