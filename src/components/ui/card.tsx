import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<typeof motion.div> {
  size?: "default" | "sm"
  interactive?: boolean
}

function Card({
  className,
  size = "default",
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
        // Tanpa overflow-hidden: dropdown Select/DatePicker di dalam kartu
        // diposisikan absolute dan sebelumnya terpotong oleh kartu.
        "nexus-card flex flex-col gap-4 py-6 px-8 text-sm relative",
        interactive && "cursor-pointer transition-colors hover:bg-[var(--nexus-bg-panel)]/50",
        className
      )}
      {...props}
    >
      {props.children as React.ReactNode}
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
        "font-heading text-lg font-semibold tracking-tight text-[var(--nexus-text-primary)]",
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
      className={cn("text-xs font-medium text-muted-foreground tracking-wide", className)}
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
        "flex items-center pt-4 border-t border-[var(--nexus-glass-border)]",
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
