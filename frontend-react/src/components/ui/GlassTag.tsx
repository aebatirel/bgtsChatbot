import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface GlassTagProps {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'muted'
  className?: string
  onClick?: () => void
}

const variantClasses = {
  default: 'liquid-tag liquid-tag-default',
  secondary: 'liquid-tag liquid-tag-secondary',
  muted: 'liquid-tag liquid-tag-muted',
}

export function GlassTag({ children, variant = 'default', className, onClick }: GlassTagProps) {
  return (
    <span
      className={cn(
        variantClasses[variant],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  )
}
