"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldAlert, 
  Sparkles,
  LogOut
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useApp } from "@/contexts/app-context"
import { navigationGroups } from "@/config/navigation"
import { cn } from "@/lib/utils"
export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { isSuperAdmin: showAdmin, profile } = useApp()

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const isCollapsed = !isHovered

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

  const handleUpgrade = async () => {
    if (!profile?.id) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: 'pro', 
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      toast("Selamat! Akun Anda berhasil ditingkatkan ke PRO Premium.", "success");
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal melakukan upgrade";
      toast("Gagal melakukan upgrade: " + msg, "danger");
    }
  };

  const handleMockClick = (name: string) => {
    toast(`Fitur "${name}" sedang dalam tahap pengembangan.`, "info");
  };

  // Build groups dynamically based on admin status
  const groups = navigationGroups.map((group) => {
    const items = [...group.items];
    if (group.title === "SETTINGS") {
      const filtered = [...items];
      if (showAdmin) {
        filtered.unshift({ name: "Admin Dashboard", path: "/user/admin", icon: ShieldAlert });
      }
      filtered.push({ name: "Log out", path: "#logout", icon: LogOut });
      return { ...group, items: filtered };
    }
    return { ...group, items };
  });

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen z-50 hidden md:flex flex-col bg-[var(--nexus-bg-sidebar)] border-r border-[var(--nexus-glass-border)] select-none transition-all duration-300 ease-out shadow-2xl",
        isCollapsed ? "w-[84px]" : "w-[260px]"
      )}
    >
      {/* Top Spacer */}
      <div className="h-6" />

      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto no-scrollbar">
        {groups.map((group) => {
          // Hide groups with empty items
          if (group.items.length === 0) return null;

          return (
            <div key={group.title} className="space-y-2">
              {/* Group Title */}
              {!isCollapsed && (
                <h4 className="px-4 text-[9px] font-black text-[var(--nexus-text-muted)] tracking-[0.25em] uppercase opacity-60">
                  {group.title}
                </h4>
              )}

              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isMock = item.path.startsWith("#") && item.path !== "#logout";
                  const isLogout = item.path === "#logout";
                  const isActive = pathname.startsWith(item.path) && !isMock && !isLogout;
                  const Icon = item.icon;
                  const isHovered = hoveredItem === item.name;

                  const linkClasses = cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 ease-out cursor-pointer relative group",
                    isCollapsed ? "justify-center h-12" : "px-4 py-3 gap-3 text-xs font-bold"
                  );

                  const activeClasses = isActive
                    ? "bg-black/5 dark:bg-white/5 text-[var(--nexus-text-primary)] border border-black/5 dark:border-white/5"
                    : "text-[var(--nexus-text-secondary)] hover:text-[var(--nexus-text-primary)] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]";

                  const renderIcon = () => (
                    <Icon className={cn(
                      "w-4.5 h-4.5 shrink-0 transition-transform duration-200", 
                      isActive ? "scale-105 opacity-100" : "opacity-60 group-hover:opacity-100 group-hover:scale-105"
                    )} />
                  );

                  const handleClick = (e: React.MouseEvent) => {
                    if (isLogout) {
                      e.preventDefault();
                      handleLogout();
                    } else if (isMock) {
                      e.preventDefault();
                      handleMockClick(item.name);
                    }
                  };

                  if (isCollapsed) {
                    return (
                      <div 
                        key={item.name}
                        className="relative flex items-center justify-center"
                        onMouseEnter={() => setHoveredItem(item.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {isLogout || isMock ? (
                          <button 
                            onClick={handleClick}
                            className={cn(linkClasses, activeClasses)}
                          >
                            {renderIcon()}
                          </button>
                        ) : (
                          <Link 
                            href={item.path}
                            className={cn(linkClasses, activeClasses)}
                          >
                            {renderIcon()}
                          </Link>
                        )}

                        {/* Collapsed Tooltip */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-[70px] px-3 py-1.5 bg-[var(--nexus-bg-popup)]/95 border border-[var(--nexus-glass-border)] backdrop-blur-xl rounded-lg z-50 pointer-events-none whitespace-nowrap shadow-lg"
                            >
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--nexus-text-primary)]">
                                {item.name}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // Expanded view
                  return isLogout || isMock ? (
                    <button
                      key={item.name}
                      onClick={handleClick}
                      className={cn(linkClasses, activeClasses)}
                    >
                      {renderIcon()}
                      <span className="truncate uppercase tracking-wider">{item.name}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={cn(linkClasses, activeClasses)}
                    >
                      {renderIcon()}
                      <span className="truncate uppercase tracking-wider">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Promo Card */}
      {!isCollapsed && profile?.plan !== 'pro' && (
        <div className="p-4 mx-3 mb-4 rounded-[20px] bg-gradient-to-br from-violet-500/5 to-violet-500/10 border border-violet-500/15 relative overflow-hidden group space-y-3">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:scale-125 transition-all duration-500" />
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-1.5 text-violet-500">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">Upgrade to Pro</span>
            </div>
            <p className="text-[9px] text-[var(--nexus-text-secondary)] font-medium leading-relaxed uppercase tracking-tight">
              Unlock more insights and advanced analytics.
            </p>
          </div>
          <button 
            onClick={handleUpgrade}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-all duration-300 relative z-10 shadow-md shadow-violet-600/20"
          >
            Upgrade Now
          </button>
        </div>
      )}
    </aside>
  )
}
