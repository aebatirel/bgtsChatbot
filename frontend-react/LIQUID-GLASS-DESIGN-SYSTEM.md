# Liquid Glass Design System

A modern, premium glassmorphism design system for React applications featuring layered depth, gradient backgrounds, and smooth animations.

## Design Philosophy

The Liquid Glass aesthetic achieves its distinctive look through:

1. **Layered Depth** - Multiple inset box-shadows create 3D glass-like surfaces
2. **Gradient Backgrounds** - 135-145° gradient angles mimic natural light refraction
3. **Backdrop Saturation** - `saturate(180%)` enriches colors behind glass elements
4. **Specular Highlights** - Top edge highlights simulate light hitting a curved surface
5. **Smooth Transitions** - Cubic-bezier easing for fluid, organic interactions

---

## Components

### GlassCard

A versatile container component with three variants.

```tsx
import { GlassCard } from '@/components/ui/GlassCard'

// Default card
<GlassCard>Content</GlassCard>

// Elevated card (stronger shadow)
<GlassCard variant="elevated">Content</GlassCard>

// Interactive card (hover effects)
<GlassCard variant="interactive">Clickable content</GlassCard>

// With accent color
<GlassCard accentColor="#0891b2">Accented content</GlassCard>
```

**CSS Classes:**
- `.liquid-card` - Base styling
- `.liquid-card-elevated` - Enhanced shadow depth
- `.liquid-card-interactive` - Hover lift effect

---

### GlassButton

Buttons with four variants and four sizes.

```tsx
import { GlassButton } from '@/components/ui/GlassButton'

// Primary (default) - gradient background with colored shadow
<GlassButton>Submit</GlassButton>

// Secondary - translucent glass effect
<GlassButton variant="secondary">Cancel</GlassButton>

// Ghost - minimal, transparent
<GlassButton variant="ghost">More</GlassButton>

// Danger - red gradient
<GlassButton variant="danger">Delete</GlassButton>

// Sizes: sm, md (default), lg, icon
<GlassButton size="lg">Large Button</GlassButton>
<GlassButton size="icon"><Icon /></GlassButton>
```

**CSS Classes:**
- `.liquid-button` - Base styling with specular highlight overlay
- `.liquid-button-primary` - Cyan gradient with glow
- `.liquid-button-secondary` - Glass effect with backdrop blur
- `.liquid-button-ghost` - Transparent with subtle hover
- `.liquid-button-danger` - Red gradient with glow

---

### GlassInput

Text input with label and error state support.

```tsx
import { GlassInput } from '@/components/ui/GlassInput'

<GlassInput
  label="Email"
  placeholder="Enter your email"
  error="Invalid email address"
/>
```

**CSS Classes:**
- `.liquid-input` - Glass input field
- `.liquid-input:focus` - Focus ring with primary color
- `.liquid-input-error` - Red error state
- `.liquid-label` - Styled label text

---

### GlassSelect

Dropdown select with custom styling.

```tsx
import { GlassSelect } from '@/components/ui/GlassSelect'

<GlassSelect
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
  ]}
/>
```

**CSS Classes:**
- `.liquid-select` - Glass select field
- `.liquid-select-icon` - Chevron icon positioning

---

### GlassBadge

Pill-shaped status indicators with optional icons.

```tsx
import { GlassBadge } from '@/components/ui/GlassBadge'
import { Star } from 'lucide-react'

// Default (no color)
<GlassBadge>New</GlassBadge>

// With custom color
<GlassBadge color="#0891b2">Active</GlassBadge>

// With icon
<GlassBadge Icon={Star} color="#f59e0b">Featured</GlassBadge>
```

**CSS Classes:**
- `.liquid-badge` - Base pill styling with glass effect

---

### GlassTag

Compact tags for categories/labels with three variants.

```tsx
import { GlassTag } from '@/components/ui/GlassTag'

<GlassTag>Default</GlassTag>
<GlassTag variant="secondary">Secondary</GlassTag>
<GlassTag variant="muted">Muted</GlassTag>

// Clickable
<GlassTag onClick={() => handleClick()}>Clickable</GlassTag>
```

**CSS Classes:**
- `.liquid-tag` - Base tag styling
- `.liquid-tag-default` - Cyan/teal tint
- `.liquid-tag-secondary` - Purple tint
- `.liquid-tag-muted` - Gray tint

---

### GlassModal

Dialog/modal with backdrop blur and spring animations.

```tsx
import { GlassModal } from '@/components/ui/GlassModal'

<GlassModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md" // sm, md, lg, xl
>
  <p>Modal content here</p>
</GlassModal>
```

**CSS Classes:**
- `.liquid-modal-backdrop` - Blurred dark overlay
- `.liquid-modal` - Glass modal container
- `.liquid-modal-header` - Header with border
- `.liquid-modal-title` - Title typography

---

### TypingIndicator

Animated typing dots for chat interfaces.

```tsx
import { TypingIndicator } from '@/components/ui/TypingIndicator'

<TypingIndicator />
```

**CSS Classes:**
- `.liquid-typing` - Container with chat bubble shape
- `.liquid-typing-dot` - Individual animated dot

---

## Floating Toolbar (Header)

The navigation header uses a centered, floating pill design.

**CSS Classes:**
- `.liquid-toolbar` - Main floating container
- `.liquid-toolbar-highlight` - Inner specular overlay
- `.liquid-logo-container` - Logo wrapper with hover glow
- `.liquid-nav-item` - Navigation link
- `.liquid-nav-item-active` - Active state marker
- `.liquid-nav-indicator` - Animated active pill (uses Framer Motion layoutId)

---

## CSS Custom Properties

The design system uses these CSS variables from `index.css`:

```css
/* Primary colors - Cyan-teal to match liquid gradient */
--color-primary-50: oklch(97% 0.02 185);
--color-primary-100: oklch(94% 0.04 185);
--color-primary-200: oklch(88% 0.08 185);
--color-primary-300: oklch(78% 0.12 180);
--color-primary-400: oklch(68% 0.14 175);
--color-primary-500: oklch(58% 0.15 175);
--color-primary-600: oklch(50% 0.14 175);
--color-primary-700: oklch(42% 0.12 180);
--color-primary-800: oklch(35% 0.10 185);
--color-primary-900: oklch(25% 0.08 190);

/* Text colors - teal-tinted (hue 195) for harmony with liquid glass */
--color-text-primary: oklch(18% 0.025 195);   /* Dark teal-black for main text */
--color-text-secondary: oklch(35% 0.03 195);  /* Medium teal for secondary text */
--color-text-muted: oklch(48% 0.025 195);     /* Lighter teal for muted/placeholder text */
--color-text-inverted: oklch(98% 0.005 185);  /* Near-white for inverted contexts */

/* Glass shadows */
--shadow-glass-sm: 0 2px 8px oklch(0% 0 0 / 0.04), 0 1px 2px oklch(0% 0 0 / 0.06);
--shadow-glass-md: 0 4px 16px oklch(0% 0 0 / 0.06), 0 2px 4px oklch(0% 0 0 / 0.08);
--shadow-glass-lg: 0 8px 32px oklch(0% 0 0 / 0.08), 0 4px 8px oklch(0% 0 0 / 0.10);
--shadow-glass-xl: 0 16px 48px oklch(0% 0 0 / 0.12), 0 8px 16px oklch(0% 0 0 / 0.10);
```

---

## Shadow Patterns

### Standard Glass Shadow (Liquid Card)
```css
box-shadow:
  0 8px 32px oklch(0% 0 0 / 0.1),       /* Outer soft shadow */
  0 2px 8px oklch(0% 0 0 / 0.06),       /* Outer tight shadow */
  inset 0 0 0 1px oklch(100% 0 0 / 0.45), /* Inner border */
  inset 0 1px 0 0 oklch(100% 0 0 / 0.7),  /* Top highlight */
  inset 0 -1px 0 0 oklch(0% 0 0 / 0.05);  /* Bottom shadow */
```

### Button Glow Shadow (Primary)
```css
box-shadow:
  0 4px 16px oklch(58% 0.15 175 / 0.35),  /* Colored glow */
  0 2px 4px oklch(0% 0 0 / 0.1),           /* Tight shadow */
  inset 0 1px 0 0 oklch(100% 0 0 / 0.3),   /* Top highlight */
  inset 0 -1px 0 0 oklch(0% 0 0 / 0.15);   /* Bottom shadow */
```

### Glass Card Background Opacity
Cards use higher opacity for better text contrast:
```css
/* .glass uses 45% white base */
background: oklch(100% 0 0 / 0.45);

/* .glass-card uses 55% white base */
background: oklch(100% 0 0 / 0.55);

/* .liquid-card uses gradient with 65%/50%/55% */
background: linear-gradient(
  145deg,
  oklch(100% 0 0 / 0.65) 0%,
  oklch(100% 0 0 / 0.5) 50%,
  oklch(100% 0 0 / 0.55) 100%
);
```

---

## Animation Guidelines

- Use Framer Motion for React animations
- Spring transitions: `{ type: 'spring', stiffness: 400, damping: 25 }`
- Hover scale: `whileHover={{ scale: 1.02 }}`
- Tap feedback: `whileTap={{ scale: 0.97 }}`
- Layout animations: Use `layoutId` for shared element transitions

---

## Browser Support

- Requires `backdrop-filter` support (all modern browsers)
- Uses `oklch()` color space (Chrome 111+, Safari 15.4+, Firefox 113+)
- Graceful degradation: solid backgrounds on unsupported browsers

---

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Floating toolbar
│   │   ├── AppShell.tsx        # Layout wrapper
│   │   └── GradientBackground.tsx
│   └── ui/
│       ├── GlassCard.tsx
│       ├── GlassButton.tsx
│       ├── GlassInput.tsx
│       ├── GlassSelect.tsx
│       ├── GlassBadge.tsx
│       ├── GlassTag.tsx
│       ├── GlassModal.tsx
│       └── TypingIndicator.tsx
└── index.css                   # All liquid-* CSS classes
```
