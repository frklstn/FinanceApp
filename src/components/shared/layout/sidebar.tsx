"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useApp } from "@/contexts/app-context"
import { AppBrand } from "./app-brand"
import { navigationItems } from "@/config/navigation"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { isSuperAdmin: showAdmin } = useApp()

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

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
    <aside className="fixed left-0 top-0 h-screen w-[84px] z-50 hidden md:flex flex-col bg-[#050507]/90 backdrop-blur-3xl border-r border-white/[0.03] select-none">
      <div className="p-6 flex items-center justify-center">
        <AppBrand collapsed={true} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path)
          const Icon = item.icon
          const isHovered = hoveredItem === item.path

          return (
            <div 
              key={item.path}
              className="relative flex items-center justify-center"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.path}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-[20px] transition-all duration-300 relative z-10",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20" 
                    : "text-white/20 hover:bg-white/[0.05] hover:text-white border border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                
                {isActive && (
                  <motion.div 
                    layoutId="active-pill-side"
                    className="absolute -left-3 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.8)]" 
                  />
                )}
              </Link>

              {/* Segmented Per-Item Label Expansion */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    className="absolute left-[70px] px-4 py-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl z-50 pointer-events-none whitespace-nowrap"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      {item.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-12 h-12 flex items-center justify-center rounded-[20px] text-white/20 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
