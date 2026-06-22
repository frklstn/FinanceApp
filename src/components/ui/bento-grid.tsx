"use client"

import { cn } from "@/lib/utils"

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  style,
}: {
  className?: string
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
  style?: React.CSSProperties
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-[32px] group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 justify-between flex flex-col space-y-4",
        className
      )}
      style={style}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-black text-white mb-1 mt-2 tracking-tight">
          {title}
        </div>
        <div className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
          {description}
        </div>
      </div>
    </div>
  )
}
