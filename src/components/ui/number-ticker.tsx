"use client"

import { cn } from "@/lib/utils"

export default function NumberTicker({
  value,
  delay = 0,
  className,
  formatter = (v: number) => v.toLocaleString(),
}: {
  value: number
  delay?: number
  className?: string
  formatter?: (value: number) => string
}) {
  return (
    <span
      className={cn(
        "inline-block tabular-nums text-white tracking-tighter animate-in fade-in duration-300",
        className
      )}
      style={{ animationDelay: delay ? `${delay * 1000}ms` : undefined }}
    >
      {formatter(value)}
    </span>
  )
}
