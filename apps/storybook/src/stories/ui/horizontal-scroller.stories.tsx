import type { Meta, StoryObj } from '@storybook/react'
import { HorizontalScroller } from '@/components/ui/horizontal-scroller'

const meta: Meta<typeof HorizontalScroller> = {
  title: 'UI/HorizontalScroller',
  component: HorizontalScroller,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    scheme: {
      control: { type: 'select' },
      options: ['dark', 'white'],
      description: 'The color scheme of the horizontal scroller',
    },
  },
  decorators: [
    (Story, context) => {
      // Pick background color based on button scheme
      const bg = context.args.scheme === 'dark' ? '#030712' : '#fff'

      return (
        <div
          style={{
            backgroundColor: bg,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '90%',
            }}
          >
            <Story />
          </div>
        </div>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof HorizontalScroller>

const CardContent = () => (
  <div className='flex min-w-max gap-4'>
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        className='h-40 w-64 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
      >
        <h3 className='mb-2 font-semibold text-gray-900'>Card {i + 1}</h3>
        <p className='text-sm text-gray-600'>
          This is a sample card content that demonstrates the horizontal
          scroller component with different types of content.
        </p>
      </div>
    ))}
  </div>
)

export const Default: Story = {
  args: {
    children: <CardContent />,
    scheme: 'white',
  },
}
