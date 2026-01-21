import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="liquid-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'liquid-input px-4 py-3 text-text-primary',
            error && 'liquid-input-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'
