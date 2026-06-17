"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useApp } from "@/contexts/app-context"
import { AppBrand } from "@/components/layout/app-brand"
import { Button } from "@/components/ui/button"
import { navigationItems } from "@/config/navigation"
import { profileService } from "@/lib/services/profile.service"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { isSuperAdmin: showAdmin, profile, user, isPro } = useApp()

  const [collapsed, setCollapsed] = useState(true)
  const [waLink, setWaLink] = useState<string | null>(null)

  const isProPlan = isPro()

  useEffect(() => {
    profileService.getWhatsappContact().then(setWaLink).catch(console.error)
  }, [])

  const menuItems = navigationItems.filter(
    (item) => (!item.isAdmin || showAdmin) && !item.hideFromSidebar
  )

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast("Berhasil keluar!", "info")
      router.push("/login")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal keluar"
      toast(msg, "danger")
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 100 : 280 }}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-[#0a0a0c]/80 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-in-out select-none overflow-hidden"
    >
      <div className={cn("p-8 flex items-center", collapsed ? "justify-center" : "justify-start pl-10")}>
        <AppBrand collapsed={collapsed} />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-4 py-4 rounded-[32px] transition-all duration-300 group relative",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
                collapsed ? "justify-center px-0" : "px-8"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xs font-black uppercase tracking-widest truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1.5 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" 
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 mt-auto space-y-6">
        {!collapsed && !isProPlan && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-[32px] bg-gradient-to-br from-indigo-500/20 to-transparent border border-indigo-500/20 space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Vault Access</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
              Unlock elite financial intelligence.
            </p>
            <Button 
              size="sm" 
              className="w-full rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] h-10 shadow-lg shadow-indigo-500/20"
              onClick={() => waLink ? window.open(waLink, '_blank') : toast('Hubungi admin.', 'info')}
            >
              Go Elite
            </Button>
          </motion.div>
        )}

        <div className={cn(
          "flex items-center gap-4 p-4 rounded-[32px] bg-white/[0.03] border border-white/5 transition-all duration-300",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-[24px] bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-black border border-indigo-500/20 shadow-xl shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  width={48} 
                  height={48} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-[0.2em]">
                  {isProPlan ? 'Elite' : 'Standard'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={handleLogout} className="p-2.5 text-muted-foreground hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
