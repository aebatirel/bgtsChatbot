import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { MessageSquare, FileText, Calendar, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Chat', Icon: MessageSquare },
  { to: '/documents', label: 'Documents', Icon: FileText },
  { to: '/timeline', label: 'Timeline', Icon: Calendar },
]

export function Header() {
  return (
    <>
      {/* SVG Filters for liquid glass effect */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="liquid-glass" primitiveUnits="objectBoundingBox">
            <feImage
              result="noise"
              width="100%"
              height="100%"
              xlinkHref="data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"
            />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.008" result="blur" />
            <feDisplacementMap
              in="blur"
              in2="noise"
              scale="0.15"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          className="liquid-toolbar"
        >
          {/* Inner highlight layer */}
          <div className="liquid-toolbar-highlight" />

          <div className="flex items-center gap-3 px-3 py-2 relative z-10">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="liquid-logo-container"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Sparkles className="w-4.5 h-4.5 text-white drop-shadow-sm" />
              </div>
            </motion.div>

            {/* Divider */}
            <div className="w-px h-7 bg-gradient-to-b from-transparent via-white/30 to-transparent" />

            {/* Navigation */}
            <nav className="flex items-center gap-0.5">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'liquid-nav-item group',
                      isActive && 'liquid-nav-item-active'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="liquid-indicator"
                          className="liquid-nav-indicator"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-all duration-200',
                            isActive
                              ? 'text-primary-600 drop-shadow-sm'
                              : 'text-text-muted group-hover:text-text-secondary'
                          )}
                        />
                        <span
                          className={cn(
                            'hidden sm:inline text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'text-primary-700'
                              : 'text-text-secondary group-hover:text-text-primary'
                          )}
                        >
                          {label}
                        </span>
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

          </div>
        </motion.div>
      </header>
    </>
  )
}
