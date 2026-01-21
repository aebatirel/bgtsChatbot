import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/cn'
import { forwardRef, type ReactNode } from 'react'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'interactive'
  accentColor?: string
  className?: string
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'default', accentColor, className, style, ...props }, ref) => {
    const variantClasses = {
      default: 'liquid-card',
      elevated: 'liquid-card liquid-card-elevated',
      interactive: 'liquid-card liquid-card-interactive cursor-pointer',
    }

    const accentStyle = accentColor
      ? {
          borderTop: `3px solid ${accentColor}`,
          ...style,
        }
      : style

    return (
      <motion.div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        style={accentStyle}
        whileHover={variant === 'interactive' ? { scale: 1.01 } : undefined}
        whileTap={variant === 'interactive' ? { scale: 0.99 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'
