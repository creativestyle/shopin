import React, { Suspense } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductCarouselWithMock } from './product-carousel-with-mock'
import { MOCK_PRODUCT_LIST } from '../../mocks/mock-product-list'
import { PRODUCT_CAROUSEL } from './teaser-mock-data'

const queryClient = new QueryClient()

const meta: Meta<typeof ProductCarouselWithMock> = {
  title: 'Teasers/Product carousel',
  component: ProductCarouselWithMock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Suspense
          fallback={<div className='p-4 text-gray-500'>Loading products…</div>}
        >
          <Story />
        </Suspense>
      </QueryClientProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    teaser: { ...PRODUCT_CAROUSEL, products: MOCK_PRODUCT_LIST },
  },
}
