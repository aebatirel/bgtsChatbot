import { motion } from 'motion/react'

// Main wave keyframes - all layers use these exact coordinates
const waveKeyframes = [
  { x: 820, c1: [720, 920, 680, 860], c2: [620, 720, 560, 580], c3: [500, 480, 420, 350], c4: [340, 220, 340, 110], end: 380 },
  { x: 880, c1: [780, 880, 700, 820], c2: [580, 680, 460, 540], c3: [440, 440, 380, 320], c4: [320, 200, 320, 100], end: 360 },
  { x: 900, c1: [800, 870, 720, 780], c2: [600, 640, 480, 500], c3: [400, 400, 360, 280], c4: [320, 160, 340, 80], end: 380 },
  { x: 860, c1: [760, 870, 680, 780], c2: [600, 680, 520, 580], c3: [440, 460, 360, 320], c4: [280, 180, 260, 80], end: 320 },
  { x: 820, c1: [720, 920, 680, 860], c2: [620, 720, 560, 580], c3: [500, 480, 420, 350], c4: [340, 220, 340, 110], end: 380 },
]

// Generate paths from keyframes
const buildMainPath = (k: typeof waveKeyframes[0]) =>
  `M1440,0 L1440,900 L${k.x},900 C${k.c1[0]},${k.c1[1]} ${k.c1[2]},${k.c1[3]} ${k.c2[0]},${k.c2[1]} C${k.c2[2]},${k.c2[3]} ${k.c3[0]},${k.c3[1]} ${k.c3[2]},${k.c3[3]} C${k.c4[0]},${k.c4[1]} ${k.c4[2]},${k.c4[3]} ${k.end},0 L1440,0 Z`

const buildEdgePath = (k: typeof waveKeyframes[0]) =>
  `M${k.x},900 C${k.c1[0]},${k.c1[1]} ${k.c1[2]},${k.c1[3]} ${k.c2[0]},${k.c2[1]} C${k.c2[2]},${k.c2[3]} ${k.c3[0]},${k.c3[1]} ${k.c3[2]},${k.c3[3]} C${k.c4[0]},${k.c4[1]} ${k.c4[2]},${k.c4[3]} ${k.end},0`

// Offset keyframes for glow (slightly inside)
const buildGlowPath = (k: typeof waveKeyframes[0]) =>
  `M1440,0 L1440,900 L${k.x - 40},900 C${k.c1[0] - 40},${k.c1[1]} ${k.c1[2] - 40},${k.c1[3]} ${k.c2[0] - 40},${k.c2[1]} C${k.c2[2] - 40},${k.c2[3]} ${k.c3[0] - 40},${k.c3[1]} ${k.c3[2] - 40},${k.c3[3]} C${k.c4[0] - 40},${k.c4[1]} ${k.c4[2] - 40},${k.c4[3]} ${k.end - 40},0 L1440,0 Z`

const mainPaths = waveKeyframes.map(buildMainPath)
const edgePaths = waveKeyframes.map(buildEdgePath)
const glowPaths = waveKeyframes.map(buildGlowPath)

// Animation duration
const animationDuration = 20

const times5 = [0, 0.25, 0.5, 0.75, 1]

// Shared transition for synced animations
const syncedTransition = {
  duration: animationDuration,
  repeat: Infinity,
  ease: 'linear' as const,
  times: times5,
}

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base white background */}
      <div className="absolute inset-0 bg-white" />

      {/* SVG for the curved gradient shape */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Animated gradient with staggered color shifts */}
          <linearGradient id="mainGradient" x1="100%" y1="0%" x2="20%" y2="80%">
            <motion.stop
              offset="0%"
              animate={{ stopColor: ['#0a1628', '#0d2840', '#081420', '#0c2030', '#0a1628'] }}
              transition={{ duration: 31, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="15%"
              animate={{ stopColor: ['#0d3a5c', '#0f4a6e', '#0b3050', '#114060', '#0d3a5c'] }}
              transition={{ duration: 29, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="30%"
              animate={{ stopColor: ['#1a7a8a', '#1e8a9a', '#167078', '#208090', '#1a7a8a'] }}
              transition={{ duration: 27, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="45%"
              animate={{ stopColor: ['#2a9d8f', '#34b89f', '#249080', '#30a895', '#2a9d8f'] }}
              transition={{ duration: 23, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="60%"
              animate={{ stopColor: ['#52b788', '#62c798', '#48a878', '#5cc090', '#52b788'] }}
              transition={{ duration: 19, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="75%"
              animate={{ stopColor: ['#8ed16e', '#9ee17e', '#80c060', '#98d878', '#8ed16e'] }}
              transition={{ duration: 17, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="90%"
              animate={{ stopColor: ['#c5dc39', '#d5ec49', '#b8d030', '#cce540', '#c5dc39'] }}
              transition={{ duration: 13, repeat: Infinity, ease: 'linear', times: times5 }}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: ['#e8f060', '#f8ff70', '#e0e850', '#f0f868', '#e8f060'] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'linear', times: times5 }}
            />
          </linearGradient>

          {/* Soft edge blur filter */}
          <filter id="softEdge" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
          </filter>

          {/* Gray gradient for border */}
          <linearGradient id="borderGradient" x1="100%" y1="0%" x2="20%" y2="80%">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="50%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>

          {/* Short blur filter for dark shadow */}
          <filter id="shortShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>

          {/* Longer blur filter for outer cyan glow */}
          <filter id="outerCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
          </filter>

          {/* Heavy blur for internal color blobs */}
          <filter id="heavyBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>

          {/* Animated clip path for containing color shapes */}
          <clipPath id="blobClip">
            <motion.path
              animate={{ d: mainPaths }}
              transition={syncedTransition}
            />
          </clipPath>
        </defs>

        {/* Brighter cyan outer glow - rendered first so blob covers inner part */}
        <motion.path
          fill="none"
          stroke="#0891b2"
          strokeWidth={100}
          filter="url(#outerCyanGlow)"
          opacity={0.3}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />

        {/* Dark cyan shadow - rendered before blob so inner part is covered */}
        <motion.path
          fill="none"
          stroke="#0a3d3d"
          strokeWidth={40}
          filter="url(#shortShadow)"
          opacity={0.35}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />

        {/* Main curved shape - covers inner shadow portions */}
        <motion.path
          fill="url(#mainGradient)"
          animate={{ d: mainPaths }}
          transition={syncedTransition}
        />

        {/* Internal animated color blobs - clipped to main shape, flowing along outline */}
        <g clipPath="url(#blobClip)" filter="url(#heavyBlur)">
          {/* Dark navy blob - flows near top of curve (bottom layer) */}
          <motion.ellipse
            fill="#0c4a6e"
            opacity={0.6}
            animate={{
              cx: [1300, 1200, 1000, 800, 1300],
              cy: [100, 200, 300, 150, 100],
              rx: [200, 220, 180, 200, 200],
              ry: [150, 170, 140, 160, 150],
            }}
            transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear', times: times5 }}
          />
          {/* Teal blob - flows along upper-mid curve */}
          <motion.ellipse
            fill="#0e7490"
            opacity={0.5}
            animate={{
              cx: [1150, 1000, 850, 750, 1150],
              cy: [250, 400, 500, 350, 250],
              rx: [180, 200, 220, 190, 180],
              ry: [140, 160, 180, 150, 140],
            }}
            transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear', times: times5 }}
          />
          {/* Cyan blob - flows along mid curve */}
          <motion.ellipse
            fill="#06b6d4"
            opacity={0.5}
            animate={{
              cx: [1050, 900, 750, 650, 1050],
              cy: [450, 550, 600, 500, 450],
              rx: [200, 180, 200, 170, 200],
              ry: [160, 150, 170, 140, 160],
            }}
            transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear', times: times5 }}
          />
          {/* Green-teal blob - flows along lower-mid curve */}
          <motion.ellipse
            fill="#2dd4bf"
            opacity={0.45}
            animate={{
              cx: [950, 850, 700, 600, 950],
              cy: [600, 680, 720, 650, 600],
              rx: [180, 200, 170, 190, 180],
              ry: [150, 160, 140, 150, 150],
            }}
            transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear', times: times5 }}
          />
          {/* Lime blob - flows along lower curve (top layer - lightest) */}
          <motion.ellipse
            fill="#84cc16"
            opacity={0.4}
            animate={{
              cx: [900, 800, 700, 650, 900],
              cy: [750, 800, 850, 780, 750],
              rx: [160, 180, 150, 170, 160],
              ry: [130, 140, 120, 135, 130],
            }}
            transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear', times: times5 }}
          />
          {/* Yellow-lime highlight blob (topmost layer) */}
          <motion.ellipse
            fill="#a3e635"
            opacity={0.35}
            animate={{
              cx: [850, 750, 650, 600, 850],
              cy: [820, 860, 880, 840, 820],
              rx: [140, 160, 130, 150, 140],
              ry: [110, 120, 100, 115, 110],
            }}
            transition={{ duration: animationDuration, repeat: Infinity, ease: 'linear', times: times5 }}
          />
        </g>

        {/* Soft outer glow - synced */}
        <motion.path
          fill="url(#mainGradient)"
          filter="url(#softEdge)"
          opacity={0.5}
          animate={{ d: glowPaths }}
          transition={syncedTransition}
        />
        {/* Inner white shadow/glow - synced */}
        <motion.path
          fill="none"
          stroke="black"
          strokeWidth={20}
          filter="url(#softEdge)"
          opacity={0.15}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />

        {/* Inner white shadow/glow - synced */}
        <motion.path
          fill="none"
          stroke="white"
          strokeWidth={100}
          filter="url(#softEdge)"
          opacity={0.35}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />

        

        {/* Secondary inner glow - synced */}
        <motion.path
          fill="none"
          stroke="white"
          strokeWidth={200}
          filter="url(#softEdge)"
          opacity={0.2}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />
        

        {/* Light gray gradient border - synced */}
        <motion.path
          fill="none"
          stroke="url(#borderGradient)"
          strokeWidth={1.5}
          opacity={0.4}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />

        {/* Top white highlight glow - liquid effect */}
        <motion.path
          fill="none"
          stroke="white"
          strokeWidth={8}
          filter="url(#shortShadow)"
          opacity={0.5}
          animate={{ d: edgePaths }}
          transition={syncedTransition}
        />
      </svg>

      {/* Subtle animated shimmer */}
      <motion.div
        className="absolute top-[8%] right-[20%] w-[150px] h-[150px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(42, 157, 143, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.15, 1.05, 1.2, 1],
          opacity: [0.15, 0.25, 0.18, 0.28, 0.15],
          x: [0, 20, -10, 15, 0],
          y: [0, -15, 10, -20, 0],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
