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
  const { isSuperAdmin: showAdmin, t } = useApp()

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
    <aside className="fixed left-0 top-0 h-screen w-[84px] z-50 hidden md:flex flex-col bg-transparent select-none">
      <div className="p-6 flex items-center justify-center">
        <AppBrand collapsed={true} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path)
          const Icon = item.icon
          const isHovered = hoveredItem === item.path

          return (
            <div 
              key={item.path}
              className="relative flex items-center justify-center group"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.path}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-[20px] transition-all duration-500 relative z-10",
                  isActive 
                    ? "bg-[var(--nexus-bg-card)]/40 backdrop-blur-md text-[var(--nexus-text-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] font-black" 
                    : "text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] hover:bg-[var(--nexus-bg-card)]/20"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-500 ease-out", 
                  isActive ? "scale-110 opacity-100" : "scale-100 opacity-60 group-hover:opacity-100 group-hover:scale-110"
                )} />
              </Link>

              {/* Tooltip Hover Bersih */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-[72px] px-3 py-1.5 bg-[var(--nexus-bg-panel)]/80 backdrop-blur-xl rounded-lg z-50 pointer-events-none whitespace-nowrap"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nexus-text-primary)]">
                      {t(`nav.${item.path.replace('/', '')}`, item.name)}
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
          className="w-12 h-12 mx-auto flex items-center justify-center rounded-[20px] text-[var(--nexus-text-muted)] hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-300"
        >
          <LogOut className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </aside>
  )
}
