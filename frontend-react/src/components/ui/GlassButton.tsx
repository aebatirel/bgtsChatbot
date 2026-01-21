import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { forwardRef, type ReactNode, type MouseEventHandler } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface GlassButtonProps {
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: MouseEventHandler<HTMLButtonElement>
  variant?: ButtonVariant
  size?: ButtonSize
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
  icon: 'p-2.5',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'liquid-button liquid-button-primary',
  secondary: 'liquid-button liquid-button-secondary',
  ghost: 'liquid-button liquid-button-ghost rounded-xl',
  danger: 'liquid-button liquid-button-danger',
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, type = 'button', onClick }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    )
  }
)

GlassButton.displayName = 'GlassButton'
