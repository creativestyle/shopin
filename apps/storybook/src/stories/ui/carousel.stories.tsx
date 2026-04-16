import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import { ProductCard } from '@/components/ui/product-card'

const PRODUCTS = [
  {
    id: 'p-1',
    slug: 'running-shoes',
    name: 'Running Shoes',
    price: { regularPriceInCents: 2999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: './product-image.png',
      alt: 'Running Shoes',
    },
  },
  {
    id: 'p-2',
    slug: 'overshirt',
    name: 'Cotton Overshirt',
    price: { regularPriceInCents: 8999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: './product-image.png',
      alt: 'Cotton Overshirt',
    },
  },
  {
    id: 'p-3',
    slug: 'weekend-bag',
    name: 'Weekend Bag',
    price: { regularPriceInCents: 19999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: './product-image.png',
      alt: 'Weekend Bag',
    },
  },
  {
    id: 'p-4',
    slug: 'linen-shirt',
    name: 'Linen Shirt',
    price: { regularPriceInCents: 5999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: './product-image.png',
      alt: 'Linen Shirt',
    },
  },
  {
    id: 'p-5',
    slug: 'denim-jacket',
    name: 'Denim Jacket',
    price: { regularPriceInCents: 7999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: './product-image.png',
      alt: 'Denim Jacket',
    },
  },
  {
    id: 'p-6',
    slug: 'travel-backpack',
    name: 'Travel Backpack',
    price: { regularPriceInCents: 14999, currency: 'EUR', fractionDigits: 2 },
    image: {
      src: './product-image.png',
      alt: 'Travel Backpack',
    },
  },
]

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

function renderTeaserSlides(count: number) {
  return Array.from({ length: count }, (_, i) => (
    <CarouselSlide key={i}>
      <div className='flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 text-base font-medium text-gray-500'>
        {i + 1}
      </div>
    </CarouselSlide>
  ))
}

function renderProductSlides() {
  return PRODUCTS.map((data) => (
    <CarouselSlide key={data.id}>
      <ProductCard
        data={data}
        locale='en-US'
      />
    </CarouselSlide>
  ))
}

export const Default: Story = {
  args: { children: null },
  render: () => <Carousel>{renderTeaserSlides(10)}</Carousel>,
}

export const ProductCards: Story = {
  args: { children: null },
  render: () => (
    <Carousel
      gridConfig={{
        'base': 2.12,
        'sm': 3.12,
        'md': 4.25,
        'lg': 4,
        'xl': 5,
        '2xl': 5,
      }}
    >
      {renderProductSlides()}
    </Carousel>
  ),
}

export const FewSlides: Story = {
  args: { children: null },
  render: () => <Carousel>{renderTeaserSlides(3)}</Carousel>,
}

export const ScrollOnly: Story = {
  args: { children: null },
  render: () => (
    <Carousel
      navigation={false}
      scrollbar={false}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <CarouselSlide key={i}>
          <div className='flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 text-base font-medium text-gray-500'>
            {i + 1}
          </div>
        </CarouselSlide>
      ))}
    </Carousel>
  ),
}
