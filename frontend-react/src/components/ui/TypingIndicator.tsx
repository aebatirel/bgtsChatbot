import { motion } from 'motion/react'

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="liquid-typing">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="liquid-typing-dot"
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}
