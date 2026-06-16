"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
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
      animate={{ width: collapsed ? 80 : 256 }}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-background/60 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-in-out select-none overflow-hidden"
    >
      <style jsx global>{`
        aside::-webkit-scrollbar { display: none; }
        aside { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className={cn("p-6 flex items-center", collapsed ? "justify-center" : "justify-start pl-8")}>
        <AppBrand collapsed={collapsed} />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                collapsed ? "justify-center" : "px-4"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-bold truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" 
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto space-y-4">
        {!collapsed && !isProPlan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-gradient-to-br from-primary/20 to-indigo-600/5 border border-primary/20 space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-2xl rounded-full -mr-8 -mt-8" />
            <p className="text-xs font-black text-white uppercase tracking-wider">Upgrade ke Pro</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
              Buka insight elit dan fitur premium finansial.
            </p>
            <Button 
              size="sm" 
              className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-9"
              onClick={() => waLink ? window.open(waLink, '_blank') : toast('Hubungi admin.', 'info')}
            >
              Aktifkan Sekarang
            </Button>
          </motion.div>
        )}

        <div className={cn(
          "flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 transition-all duration-300",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-sm font-black border border-primary/20 shadow-lg shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                  {isProPlan ? 'Premium' : 'Standard'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
