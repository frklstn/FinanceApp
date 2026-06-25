"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

function LandingPageContent() {
  const { appSettings } = useApp();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              {appSettings?.app_name === 'FinanceApp' ? (
                <>
                  FRKL<span className="text-indigo-400 font-extrabold">STN</span>
                </>
              ) : (
                appSettings?.app_name || "FRKLSTN"
              )}
            </span>
          </div>
          <Link
            href="/finance/dashboard"
            className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all active:scale-95"
          >
            Masuk Ke Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Fase 10: Digital Ecosystem Ready</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Kelola Finansial <br /> Tanpa Batas.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-400 mb-12 leading-relaxed">
            Platform manajemen keuangan premium yang dirancang untuk kecepatan, 
            keamanan, dan transparansi total. Monitor setiap transaksi dengan estetika modern.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/finance/dashboard"
              className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Mulai Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all backdrop-blur-sm">
              Pelajari Fitur
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all group">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Keamanan Militer</h3>
            <p className="text-neutral-400 leading-relaxed">
              Enkripsi end-to-end yang menjaga data transaksi Anda tetap privat dan aman setiap saat.
            </p>
          </div>

          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Analitik Real-time</h3>
            <p className="text-neutral-400 leading-relaxed">
              Visualisasi data yang intuitif memberikan gambaran jernih tentang aliran kas Anda secara instan.
            </p>
          </div>

          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Integrasi Ekosistem</h3>
            <p className="text-neutral-400 leading-relaxed">
              Terhubung mulus dengan berbagai platform pembayaran digital untuk efisiensi maksimal.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-6">
          <div className="text-neutral-500 text-sm">
            © 2026 {appSettings?.app_name || "FinanceApp"}. All rights reserved.
          </div>
          <div className="flex gap-8 text-sm text-neutral-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return <LandingPageContent />;
}
