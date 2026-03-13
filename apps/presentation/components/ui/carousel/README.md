# Carousel component

Reusable, responsive carousel UI for the storefront (`@apps/presentation`). Supports configurable slides-per-view, navigation, scrollbar indicator, and accessibility; built for Next.js with TypeScript.

## ✨ Features

- ✅ **Responsive Grid System**: Automatically adjusts slides per view based on screen size with fractional slide support
- ✅ **Hydration Safe**: No hydration errors in NextJS SSR environment
- ✅ **Custom Scrollbar**: Visual progress indicator for scroll position
- ✅ **CLS Prevention**: Reserved space for scrollbar to prevent layout shifts
- ✅ **Horizontal Layout**: Optimized for horizontal scrolling with snap points
- ✅ **Highly Customizable**: Custom arrows, grid configurations, and breakpoint-specific settings
- ✅ **Composable API**: Use CarouselSlide children for flexible content
- ✅ **Accessibility**: ARIA labels and keyboard navigation support
- ✅ **Progressive Rendering**: Smart slide rendering for optimal performance
- ✅ **Smooth Scrolling**: Respects user's motion preferences (`prefers-reduced-motion`)
- ✅ **Performance Optimized**: IntersectionObserver, lazy rendering, and CSS-based layout

---

## 📑 Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Props](#props)
  - [Carousel Props](#carousel-props)
  - [CarouselSlide Props](#carouselslide-props)
  - [Default Grid Configuration](#default-grid-configuration)
- [Customizing Grid Settings](#-customizing-grid-settings) ⭐
  - [Method 1: Fixed Number of Slides](#method-1-fixed-number-of-slides-all-breakpoints)
  - [Method 2: Custom Breakpoint Configuration](#method-2-custom-breakpoint-configuration)
  - [Method 3: Partial Overrides](#method-3-partial-overrides)
  - [Grid Configuration Patterns](#grid-configuration-patterns)
  - [Responsive Breakpoints Reference](#responsive-breakpoints-reference)
  - [Tips for Choosing Grid Values](#tips-for-choosing-grid-values)
  - [Visual Grid Examples](#visual-grid-examples)
- [Examples](#-examples)
- [Styling & Customization](#-styling--customization)
- [Architecture](#architecture)
- [Accessibility](#accessibility)
- [Performance Optimizations](#performance-optimizations)
- [Troubleshooting](#troubleshooting)

---

## Installation

The carousel is already integrated into the project. Import it from the components directory:

```tsx
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
```

## Basic Usage

```tsx
import { Carousel, CarouselSlide } from '@/components/ui/carousel'

interface Product {
  id: number
  name: string
  image: string
}

const products: Product[] = [
  // your products...
]

function ProductCarousel() {
  return (
    <Carousel>
      {products.map((product) => (
        <CarouselSlide key={product.id}>
          <div className='flex h-full flex-col p-4'>
            <img
              src={product.image}
              alt={product.name}
            />
            <h3>{product.name}</h3>
          </div>
        </CarouselSlide>
      ))}
    </Carousel>
  )
}
```

**Important**: Always use `flex h-full flex-col` (or `flex-row` for horizontal layouts) on your slide content to ensure it takes up the full available space of the carousel item.

## Props

### Carousel Props

| Prop            | Type                                       | Default   | Description                           |
| --------------- | ------------------------------------------ | --------- | ------------------------------------- |
| `children`      | `ReactNode`                                | -         | CarouselSlide components to display   |
| `navigation`    | `boolean`                                  | `true`    | Show/hide navigation arrows           |
| `scrollbar`     | `boolean`                                  | `true`    | Show/hide custom scrollbar pagination |
| `gridConfig`    | `Partial<CarouselColumnsConfig> \| number` | See below | Custom slides per view configuration  |
| `onSlideChange` | `(currentIndex: number) => void`           | -         | Callback when slide changes           |

### CarouselSlide Props

| Prop        | Type        | Description                        |
| ----------- | ----------- | ---------------------------------- |
| `children`  | `ReactNode` | Content to display in the slide    |
| `className` | `string`    | Optional CSS classes for the slide |

### Default Grid Configuration

The carousel uses a responsive grid system based on Tailwind breakpoints. The default configuration shows fractional values to create a "peek" effect where partial slides are visible at screen edges, encouraging users to scroll:

```typescript
{
  base: 1.12,   // Mobile (< 640px)    - Shows ~1 slide with small peek
  sm: 2.12,     // Small devices (≥ 640px)  - Shows ~2 slides with peek
  md: 3.12,     // Medium devices (≥ 768px) - Shows ~3 slides with peek
  lg: 4,        // Large devices (≥ 1024px) - Shows ~4 slides
  xl: 5,        // Extra large (≥ 1280px)   - Shows ~5 slides
  '2xl': 5      // 2X Extra large (≥ 1536px) - Shows exactly 5 slides
}
```

**Understanding the Values:**

- **Whole numbers** (e.g., `3`) - Show exactly that many complete slides
- **Fractional numbers** (e.g., `3.12`) - Show that many complete slides plus a partial "peek" of the next slide
- The fractional part (`.12`) creates visual interest and indicates more content is available

**Example:** `3.12` means:

- 3 full slides are visible
- 12% of a 4th slide is visible (the "peek")
- This encourages users to explore more content

---

## 🎨 Customizing Grid Settings

The carousel provides powerful grid customization through the `gridConfig` prop. You can customize the number of slides shown at different screen sizes to perfectly match your design requirements.

### Method 1: Fixed Number of Slides (All Breakpoints)

The simplest approach - use the same number of slides across all screen sizes:

```tsx
// Always show 4 complete slides regardless of screen size
<Carousel gridConfig={4}>
  {products.map((product) => (
    <CarouselSlide key={product.id}>
      <ProductCard product={product} />
    </CarouselSlide>
  ))}
</Carousel>
```

### Method 2: Custom Breakpoint Configuration

For more control, specify different values for each breakpoint:

```tsx
<Carousel
  gridConfig={{
    'base': 1, // 1 slide on mobile
    'sm': 2, // 2 slides on small screens
    'md': 3, // 3 slides on medium screens
    'lg': 4, // 4 slides on large screens
    'xl': 5, // 5 slides on extra large
    '2xl': 6, // 6 slides on 2xl screens
  }}
>
  {products.map((product) => (
    <CarouselSlide key={product.id}>
      <ProductCard product={product} />
    </CarouselSlide>
  ))}
</Carousel>
```

### Method 3: Partial Overrides

You don't need to specify all breakpoints - only override the ones you want to change:

```tsx
<Carousel
  gridConfig={{
    base: 1.15, // Override mobile to show more peek
    xl: 5.2, // Override XL for larger peek
    // Other breakpoints use defaults (2.12, 3.12, etc.)
  }}
>
  {/* ... */}
</Carousel>
```

---

## 📝 Examples

### Complete Product Carousel Example

A production-ready product carousel with custom grid configuration:

```tsx
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import { ProductCard } from '@/components/product/ProductCard'

interface Product {
  id: string
  name: string
  price: number
  image: string
}

export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <Carousel
      gridConfig={{
        base: 1.12, // Mobile: 1 card + small peek
        sm: 2.12, // Tablet: 2 cards + peek
        md: 3, // Medium: 3 full cards
        lg: 4, // Desktop: 4 full cards
        xl: 5, // Large: 5 full cards
      }}
      onSlideChange={(index) => {
        console.log(`Viewing slide ${index}`)
      }}
    >
      {products.map((product) => (
        <CarouselSlide key={product.id}>
          <div className='flex h-full flex-col'>
            <ProductCard product={product} />
          </div>
        </CarouselSlide>
      ))}
    </Carousel>
  )
}
```

---

## Architecture

### Components

1. **Carousel** (`carousel.tsx`) - Main component with all logic and CLS prevention
2. **CarouselSlide** (`carousel-slide.tsx`) - Individual slide wrapper component
3. **CarouselNavigation** (`carousel-navigation.tsx`) - Previous/Next arrow buttons
4. **CarouselScrollbar** (`carousel-scrollbar.tsx`) - Custom scrollbar indicator (visual only)

### Hook

**useCarousel** (`use-carousel.ts`) - Manages:

- Responsive breakpoint detection
- CSS custom property generation
- Scroll behavior preferences (respects reduced motion)
- Slides per view calculation

### Types

All TypeScript types are defined in `types/carousel.ts` for type safety.

---

## Accessibility

- ARIA labels on navigation buttons
- `role="group"` on slide container
- `aria-live="polite"` for screen reader announcements
- Keyboard navigation support
- Respects `prefers-reduced-motion`

---

## Performance Optimizations

1. **Lazy rendering**: Only renders visible slides + buffer
2. **CSS-based layout**: Uses CSS Grid and custom properties for responsive behavior
3. **Memoization**: Expensive calculations are memoized with `useMemo`
4. **Callback stability**: Navigation functions use `useCallback` to prevent re-renders
5. **Throttled event handlers**: Scroll and resize events are throttled (100-150ms) using `@/lib/throttle` to reduce excessive function calls and improve performance

---
