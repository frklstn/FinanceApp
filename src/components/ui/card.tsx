import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<typeof motion.div> {
  size?: "default" | "sm"
  glass?: boolean
  interactive?: boolean
}

function Card({
  className,
  size = "default",
  glass = true,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <motion.div
      data-slot="card"
      data-size={size}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={interactive ? { scale: 1.01, translateY: -2 } : undefined}
      className={cn(
        "nexus-card flex flex-col gap-4 py-6 px-8 text-sm overflow-hidden relative",
        glass ? "backdrop-blur-3xl" : "bg-card border-border",
        interactive && "cursor-pointer transition-colors hover:bg-[var(--nexus-bg-panel)]/50",
        className
      )}
      {...props}
    >
      {glass && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      )}
      {props.children}
    </motion.div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-black text-lg tracking-tight text-white",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs font-bold text-muted-foreground uppercase tracking-widest", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "ml-auto",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex-1", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center pt-4 border-t border-white/5",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
