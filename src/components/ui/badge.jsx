import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50",
        destructive:
          "border-transparent bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
        rose:
          "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        emerald:
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        warning:
          "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
        amber:
          "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
        info:
          "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
        sky:
          "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
        purple:
          "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
        outline: "text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const baseBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  borderRadius: 9999,
  padding: "2.5px 9px",
  fontSize: 11,
  fontWeight: 750,
  lineHeight: 1.25,
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  transition: "all 0.15s ease",
  border: "1px solid transparent",
  fontFamily: "inherit",
}

const variantFallbackStyles = {
  default: {
    backgroundColor: "var(--text, #18181b)",
    color: "var(--cream, #fafafa)",
    borderColor: "transparent",
  },
  secondary: {
    backgroundColor: "rgba(113, 113, 122, 0.12)",
    color: "inherit",
    borderColor: "rgba(113, 113, 122, 0.2)",
  },
  destructive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  rose: {
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    color: "#f43f5e",
    borderColor: "rgba(244, 63, 94, 0.25)",
  },
  success: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  emerald: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    color: "#d97706",
    borderColor: "rgba(245, 158, 11, 0.28)",
  },
  amber: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    color: "#d97706",
    borderColor: "rgba(245, 158, 11, 0.28)",
  },
  info: {
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    color: "#0284c7",
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
  sky: {
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    color: "#0284c7",
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
  purple: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    color: "#8b5cf6",
    borderColor: "rgba(139, 92, 246, 0.25)",
  },
  outline: {
    backgroundColor: "transparent",
    color: "inherit",
    borderColor: "var(--border, rgba(113, 113, 122, 0.25))",
  },
}

function Badge({ className, variant = "default", style, ...props }) {
  const vStyle = variantFallbackStyles[variant] || variantFallbackStyles.default
  return (
    <div
      data-badge="true"
      className={cn(badgeVariants({ variant }), className)}
      style={{
        ...baseBadgeStyle,
        ...vStyle,
        ...style,
      }}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
