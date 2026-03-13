import type { Meta, StoryObj } from '@storybook/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'

// READ FULL API OPTIONS HERE: https://www.radix-ui.com/primitives/docs/components/popover

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    className: { table: { disable: true } },
    speed: {
      control: { type: 'number', min: 0.1, step: 0.1 },
      description: 'Rotation speed in seconds for one full rotation',
    },
  },
  args: {
    speed: 1,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    return (
      <LoadingSpinner
        className='size-16'
        {...args}
      />
    )
  },
}

export const InsideTheButton: Story = {
  render: (args) => {
    return (
      <div className='flex flex-wrap items-center justify-center gap-4'>
        <Button className='py-2'>
          <LoadingSpinner
            className='mx-10 size-8'
            {...args}
          />
        </Button>
        <Button
          variant='secondary'
          className='py-2'
        >
          <LoadingSpinner
            className='mx-10 size-8'
            {...args}
          />
        </Button>
      </div>
    )
  },
}

export const Examples: Story = {
  argTypes: {
    ...meta.argTypes,
    speed: { table: { disable: true } },
  },
  render: () => {
    return (
      <div className='space-y-4 rounded-lg bg-gray-50 p-6'>
        <div className='flex items-center gap-6'>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Small (size-4)</p>
            <LoadingSpinner className='size-4' />
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Medium (size-6)</p>
            <LoadingSpinner className='size-6' />
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Large (size-8)</p>
            <LoadingSpinner className='size-8' />
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Extra Large (size-12)</p>
            <LoadingSpinner className='size-12' />
          </div>
        </div>

        <div className='space-y-2 border-t pt-4'>
          <p className='text-sm font-medium'>Speed Variations</p>
          <div className='flex items-center gap-6'>
            <div className='space-y-2'>
              <p className='text-xs text-gray-600'>Fast (0.5s)</p>
              <LoadingSpinner
                className='size-8'
                speed={0.5}
              />
            </div>
            <div className='space-y-2'>
              <p className='text-xs text-gray-600'>Normal (1s)</p>
              <LoadingSpinner
                className='size-8'
                speed={1}
              />
            </div>
            <div className='space-y-2'>
              <p className='text-xs text-gray-600'>Slow (2s)</p>
              <LoadingSpinner
                className='size-8'
                speed={2}
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
}
