# GradientBackground Component

Animated liquid glass-style gradient background with SVG path morphing and layered effects.

## Overview

The component creates an animated gradient blob that flows from the top-right corner diagonally across the screen, with multiple visual layers creating a liquid/glass effect.

## Architecture

### Coordinate System
- SVG viewBox: `0 0 1440 900`
- The blob occupies the right side of the screen
- Curved edge flows from bottom (~x:820, y:900) to top (~x:380, y:0)

### Wave Keyframes
5 keyframes define the blob shape using cubic bezier curves. Each keyframe contains:
- `x`: Starting x-coordinate at bottom
- `c1-c4`: Control points for 3 bezier curve segments
- `end`: Ending x-coordinate at top

All layers derive their paths from this single keyframe data to stay synchronized.

## Layers (render order)

### 1. Outer Shadows (rendered first, behind blob)
- **Brighter cyan outer glow** - `#0891b2`, 100px stroke, 25px blur, 30% opacity
- **Dark cyan shadow** - `#0a3d3d`, 40px stroke, 8px blur, 35% opacity

These render before the main blob so the blob covers their inner portions.

### 2. Main Blob
- Filled with animated linear gradient (`mainGradient`)
- Gradient flows from dark navy (top-right) to yellow-lime (bottom-left edge)
- 8 color stops with staggered animation durations (11-31s) for organic color shifting

### 3. Internal Color Blobs
Animated ellipses clipped to the blob shape with heavy blur (60px):
- **Dark navy** `#0c4a6e` - flows near top (bottom layer)
- **Teal** `#0e7490` - upper-mid curve
- **Cyan** `#06b6d4` - mid curve
- **Green-teal** `#2dd4bf` - lower-mid curve
- **Lime** `#84cc16` - lower curve
- **Yellow-lime** `#a3e635` - bottom edge (top layer)

All blobs follow the curve path and use the same animation duration as the main blob for synchronization.

### 4. Inner Glows & Highlights
- **Soft outer glow** - gradient-filled, blurred, 50% opacity
- **Black inner shadow** - 20px stroke, 15% opacity (depth effect)
- **White inner glow** - 100px stroke, 35% opacity
- **Secondary white glow** - 200px stroke, 20% opacity (wider spread)

### 5. Border & Top Highlights
- **Gray gradient border** - 1.5px stroke, 40% opacity
- **Top white highlight** - 8px stroke with blur (liquid specular)

### 6. Shimmer
Floating radial gradient div that pulses and moves subtly.

## Animation

### Synchronized Transitions
All path-based elements use `syncedTransition`:
```js
{
  duration: 20, // seconds
  repeat: Infinity,
  ease: 'linear',
  times: [0, 0.25, 0.5, 0.75, 1]
}
```

### Gradient Color Animation
Each gradient stop animates independently with prime-number durations (11, 13, 17, 19, 23, 27, 29, 31 seconds) creating organic, non-repeating color shifts.

## SVG Filters

| Filter ID | Purpose | stdDeviation |
|-----------|---------|--------------|
| `softEdge` | Inner glows, soft edges | 20 |
| `shortShadow` | Dark shadow, top highlight | 8 |
| `outerCyanGlow` | Outer cyan glow | 25 |
| `heavyBlur` | Internal color blobs | 60 |

## Clip Path

`blobClip` - Animated clip path that follows the main blob shape, used to contain the internal color blobs within the gradient area.
