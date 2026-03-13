import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import { ProductCard } from '@/components/ui/product-card'

// Mock product data for Storybook (from product-grid.stories.tsx)
const mockProducts = [
  {
    id: 'product-1',
    slug: 'product-1',
    name: 'Classic White T-Shirt',
    price: { regularPriceInCents: 2999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'White T-Shirt',
    },
  },
  {
    id: 'product-2',
    slug: 'product-2',
    name: 'Denim Jeans',
    price: { regularPriceInCents: 8999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Denim Jeans',
    },
  },
  {
    id: 'product-3',
    slug: 'product-3',
    name: 'Leather Jacket',
    price: { regularPriceInCents: 19999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Leather Jacket',
    },
  },
  {
    id: 'product-4',
    slug: 'product-4',
    name: 'Summer Dress',
    price: { regularPriceInCents: 5999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Summer Dress',
    },
  },
  {
    id: 'product-5',
    slug: 'product-5',
    name: 'Sneakers',
    price: { regularPriceInCents: 7999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Sneakers',
    },
  },
  {
    id: 'product-6',
    slug: 'product-6',
    name: 'Winter Coat',
    price: { regularPriceInCents: 14999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: '/product-image.png',
      alt: 'Winter Coat',
    },
  },
]

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

// Container wrapper that sets up fullbleed CSS variables and container margins
const FullbleedContainer = ({ children }: { children: React.ReactNode }) => (
  <div
    className='flex min-h-screen w-full items-center bg-white'
    style={
      {
        '--_container-padding': '0.75rem',
        '--_container-width': '1440px',
        '--_fullbleed':
          'max(var(--_container-padding), 50vw - var(--_container-width) / 2)',
      } as React.CSSProperties
    }
  >
    <div
      className='w-full min-w-0 py-8'
      style={
        {
          marginInline: 'var(--_fullbleed)',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  </div>
)

/**
 * Default carousel with 15 portrait-oriented gray placeholder slides.
 * Shows typical carousel behavior with multiple slides and fullbleed effect.
 */
export const Default: Story = {
  render: () => {
    const placeholders = Array.from({ length: 15 }, (_, i) => (
      <CarouselSlide key={i}>
        <div className='flex aspect-3/4 w-full items-center justify-center rounded-lg bg-gray-100 text-lg font-medium text-gray-400'>
          Slide {i + 1}
        </div>
      </CarouselSlide>
    ))

    return (
      <FullbleedContainer>
        <Carousel>{placeholders}</Carousel>
      </FullbleedContainer>
    )
  },
}

/**
 * Carousel with ProductCard components.
 * Uses mock product data to demonstrate how the carousel works with product cards.
 * Product card heights:
 * - base (<640px): 182px
 * - sm (≥640px): 205px
 * - md (≥768px): 305px
 * - lg (≥1024px): min 425px (flexible with grow)
 * Custom configuration optimized for product cards:
 * - base (<640px): 2.12 slides - optimized for 450px-600px screens (shows 2+ tiles with peek)
 * - sm (≥640px): 3.12 slides (3 tiles + peek)
 * - md (≥768px): 4.25 slides (4 tiles + peek)
 * - lg (≥1024px): 4 slides
 * - xl (≥1280px): 5 slides
 * - 2xl (≥1536px): 5 slides
 */
export const WithProductCards: Story = {
  render: () => {
    // Create enough products to demonstrate scrolling at all breakpoints
    // Need at least 10 products to show scrolling on xl/2xl (5 slides per view)
    const allProducts = [
      ...mockProducts,
      ...mockProducts,
      ...mockProducts.slice(0, 4), // Total: 16 products
    ].map((productData, index) => ({
      ...productData,
      id: `${productData.id}-${index}`,
      slug: `${productData.slug}-${index}`,
    }))

    const productCards = allProducts.map((productData) => (
      <CarouselSlide key={productData.id}>
        <ProductCard
          data={productData}
          locale='en-US'
        />
      </CarouselSlide>
    ))

    return (
      <FullbleedContainer>
        <Carousel
          gridConfig={{
            'base': 2.12, // Show 2+ tiles at 450px-600px (optimized for new 442:551 aspect ratio)
            'sm': 3.12, // Show 3+ tiles at 640px+
            'md': 4.25, // Show 4+ tiles at 768px+
            'lg': 4, // Show 4 tiles at 1024px+
            'xl': 5, // Show 5 tiles at 1280px+
            '2xl': 5, // Show 5 tiles at 1536px+
          }}
        >
          {productCards}
        </Carousel>
      </FullbleedContainer>
    )
  },
}

/**
 * Carousel with custom grid settings showing 9 items at highest resolution
 * and 2.5 items at smallest resolution. Uses landscape-oriented smaller items.
 * Demonstrates fullbleed with partial item reveal.
 */
export const CustomGridSettings: Story = {
  render: () => {
    const placeholders = Array.from({ length: 20 }, (_, i) => (
      <CarouselSlide key={i}>
        <div className='flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100 text-base font-medium text-gray-400'>
          Item {i + 1}
        </div>
      </CarouselSlide>
    ))

    return (
      <FullbleedContainer>
        <Carousel
          gridConfig={{
            'base': 2.5,
            'sm': 3.5,
            'md': 4.5,
            'lg': 7,
            'xl': 8,
            '2xl': 9,
          }}
        >
          {placeholders}
        </Carousel>
      </FullbleedContainer>
    )
  },
}

/**
 * Carousel with only 3 items - not enough to trigger carousel navigation.
 * Shows how the component behaves when there aren't sufficient slides.
 */
export const InsufficientSlides: Story = {
  render: () => {
    const limitedPlaceholders = Array.from({ length: 3 }, (_, i) => (
      <CarouselSlide key={i}>
        <div className='flex aspect-3/4 w-full items-center justify-center rounded-lg bg-gray-100 text-lg font-medium text-gray-400'>
          Slide {i + 1}
        </div>
      </CarouselSlide>
    ))

    return (
      <FullbleedContainer>
        <Carousel>{limitedPlaceholders}</Carousel>
      </FullbleedContainer>
    )
  },
}

/**
 * Carousel without navigation controls, demonstrating scroll-only mode with fullbleed.
 */
export const NoNavigation: Story = {
  render: () => {
    const placeholders = Array.from({ length: 10 }, (_, i) => (
      <CarouselSlide key={i}>
        <div className='flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 text-lg font-medium text-gray-400'>
          {i + 1}
        </div>
      </CarouselSlide>
    ))

    return (
      <FullbleedContainer>
        <Carousel
          navigation={false}
          scrollbar={false}
        >
          {placeholders}
        </Carousel>
      </FullbleedContainer>
    )
  },
}

/**
 * Carousel with single slide per view across all resolutions.
 * Custom grid configuration ensures only one slide is visible at a time.
 */
export const SingleSlide: Story = {
  render: () => {
    const placeholders = Array.from({ length: 5 }, (_, i) => (
      <CarouselSlide key={i}>
        <div className='flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100 text-lg font-medium text-gray-400'>
          Slide {i + 1}
        </div>
      </CarouselSlide>
    ))

    return (
      <FullbleedContainer>
        <Carousel gridConfig={1}>{placeholders}</Carousel>
      </FullbleedContainer>
    )
  },
}
