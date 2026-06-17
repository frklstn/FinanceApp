'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ShieldCheck, ArrowRight, Activity, Terminal, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg('Protocol Violation: All fields required.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Complexity Failure: Min 6 characters required.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Validation Error: Secrets do not match.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        const isSessionActive = data.session !== null;
        if (isSessionActive) {
          setSuccessMsg('Registration Authorized. Initializing Node...');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1500);
        } else {
          setSuccessMsg('Entity Registered. Verify Communication via Inbox.');
          setFullName(''); setEmail(''); setPassword(''); setConfirmPassword('');
        }
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full -z-10" />

      <div className="glass-card p-8 md:p-12 w-full border-white/5 bg-white/[0.01] backdrop-blur-3xl rounded-[40px] shadow-2xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <User className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Node <span className="text-emerald-500">Initialization</span></h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Register New Entity in FinanceNode OS</p>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Entity Alias</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="LEGAL_NAME"
                  disabled={loading}
                  className="pl-14 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-sm font-bold tracking-tight h-auto"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Identifier</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ID_SEQUENCE@DOMAIN.COM"
                  disabled={loading}
                  className="pl-14 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-sm font-bold tracking-tight h-auto"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Primary Secret</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="pl-14 pr-12 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-sm font-bold tracking-tight h-auto"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Confirm Secret</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="pl-14 pr-12 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-sm font-bold tracking-tight h-auto"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-[24px] bg-indigo-500 hover:bg-indigo-600 border-none py-8 text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Initializing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4" />
                <span>Initialize Node</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </form>

        <div className="pt-6 text-center">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
            Already Synchronized?{' '}
            <Link href="/login" className="text-emerald-500 hover:text-emerald-400 transition-all underline decoration-emerald-500/20 underline-offset-4">
              Access Vault
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
