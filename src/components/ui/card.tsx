import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<typeof motion.div> {
  size?: "default" | "sm"
  glass?: boolean
  interactive?: boolean
  delay?: number
}

function Card({
  className,
  size = "default",
  glass = true,
  interactive = false,
  delay = 0,
  ...props
}: CardProps) {
  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={interactive ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
      data-slot="card"
      data-size={size}
      className={cn(
        "nexus-card group relative flex flex-col gap-4 py-6 px-8 text-sm overflow-hidden",
        "transition-all duration-300",
        glass 
          ? "border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-card)]/60 backdrop-blur-xl" 
          : "bg-card border-border",
        interactive && "cursor-pointer",
        className
      )}
      {...props}
    />
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
        "font-black text-lg tracking-tight text-[var(--nexus-text-primary)]",
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
