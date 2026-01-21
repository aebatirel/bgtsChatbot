import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface GlassBadgeProps {
  children: ReactNode
  color?: string
  Icon?: LucideIcon
  className?: string
}

export function GlassBadge({ children, color, Icon, className }: GlassBadgeProps) {
  const colorStyles = color
    ? {
        background: `linear-gradient(135deg, color-mix(in oklch, ${color} 25%, transparent) 0%, color-mix(in oklch, ${color} 15%, transparent) 100%)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${color} 35%, transparent), inset 0 1px 0 0 oklch(100% 0 0 / 0.4)`,
        color,
      }
    : undefined

  return (
    <span
      className={cn('liquid-badge', className)}
      style={colorStyles}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  )
}
