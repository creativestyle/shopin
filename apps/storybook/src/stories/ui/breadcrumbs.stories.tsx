import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { CrumbResponse } from '@core/contracts/core/crumb'

const CRUMBS = {
  category: [
    { label: 'Women', path: '/women' },
    { label: 'Shoes', path: '/women/shoes' },
    { label: 'Sneakers', path: '/women/shoes/sneakers' },
  ],
  product: [
    { label: 'Men', path: '/men' },
    { label: 'Jackets', path: '/men/jackets' },
    { label: 'Outdoor', path: '/men/jackets/outdoor' },
    {
      label: 'Lightweight Rain Jacket',
      path: '/men/jackets/outdoor/lightweight-rain-jacket',
    },
  ],
  checkout: [
    { label: 'Cart', path: '/cart' },
    { label: 'Checkout', path: '/checkout' },
    { label: 'Delivery', path: '/checkout/delivery' },
    { label: 'Payment', path: '/checkout/payment' },
  ],
  longPath: [
    { label: 'Home & Living', path: '/home-living' },
    { label: 'Kitchen', path: '/home-living/kitchen' },
    { label: 'Cookware', path: '/home-living/kitchen/cookware' },
    {
      label: 'Stainless Steel',
      path: '/home-living/kitchen/cookware/stainless-steel',
    },
    {
      label: '3-Piece Induction Pan Set',
      path: '/home-living/kitchen/cookware/stainless-steel/3-piece-induction-pan-set',
    },
  ],
} satisfies Record<
  'category' | 'product' | 'checkout' | 'longPath',
  CrumbResponse[]
>

const meta = {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    crumbs: {
      control: { type: 'object' },
      description: 'Array of breadcrumb items',
    },
  },
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { crumbs: CRUMBS.product },
}
