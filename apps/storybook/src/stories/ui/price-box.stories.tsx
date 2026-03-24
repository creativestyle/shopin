import type { Meta, StoryObj } from '@storybook/react'
import { PriceBox } from '@/components/ui/price/price-box'

const meta: Meta<typeof PriceBox> = {
  title: 'UI/PriceBox',
  component: PriceBox,
  tags: ['autodocs'],
  args: {
    price: {
      regularPriceInCents: 1955,
      discountedPriceInCents: 1599,
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const RegularPrice: Story = {
  args: {
    price: {
      regularPriceInCents: 25900,
      currency: 'EUR',
      fractionDigits: 2,
    },
    size: 'medium',
    disabled: false,
    footer: 'inkl. MwSt.',
  },
}

export const DiscountedPriceWithHeaderAndFooter: Story = {
  args: {
    price: {
      regularPriceInCents: 1995,
      discountedPriceInCents: 1295,
      recommendedRetailPriceInCents: 2495,
      omnibusPriceInCents: 1795,
      currency: 'EUR',
      fractionDigits: 2,
    },
    size: 'medium',
    disabled: false,
    footer: 'inkl. MwSt.',
    recommendedRetailPriceLabel: 'UVP',
    omnibusPriceLabel: '30-Tage Bestpreis',
  },
}

export const RegularPriceWithUnitPriceInfo: Story = {
  args: {
    price: {
      regularPriceInCents: 39995,
      currency: 'EUR',
      fractionDigits: 2,
      regularUnitPriceInCents: 1995,
      unit: 'Stück',
    },
    size: 'medium',
    disabled: false,
    footer: 'inkl. MwSt.',
  },
}

export const DisabledPrice: Story = {
  args: {
    price: {
      regularPriceInCents: 1999,
      discountedPriceInCents: 1599,
    },
    size: 'medium',
    disabled: true,
  },
}
