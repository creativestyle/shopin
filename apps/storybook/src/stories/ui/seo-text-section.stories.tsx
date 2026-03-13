import type { Meta, StoryObj } from '@storybook/react'
import { SEOTextSection } from '@/components/ui/seo-text-section'

const meta: Meta<typeof SEOTextSection> = {
  title: 'UI/SEOTextSection',
  component: SEOTextSection,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'About this product',
    content: 'This is an SEO-friendly description block for the product page.',
  },
}
