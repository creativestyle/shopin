import type { Meta, StoryObj } from '@storybook/react'
import { Divider } from '@/components/ui/divider'

const meta: Meta<typeof Divider> = {
  title: 'UI/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className='w-[400px] space-y-4 p-8'>
      <div>
        <p className='text-sm text-gray-700'>Content above</p>
      </div>
      <Divider />
      <div>
        <p className='text-sm text-gray-700'>Content below</p>
      </div>
    </div>
  ),
}

export const InCard: Story = {
  render: () => (
    <div className='w-[400px] rounded-lg border border-gray-200 bg-white p-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Section Title</h3>
          <p className='mt-2 text-sm text-gray-600'>
            Some content that needs to be separated from the next section.
          </p>
        </div>
        <Divider />
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Another Section
          </h3>
          <p className='mt-2 text-sm text-gray-600'>
            Content that appears after the divider.
          </p>
        </div>
      </div>
    </div>
  ),
}

export const MultipleDividers: Story = {
  render: () => (
    <div className='w-[400px] space-y-4 p-8'>
      <div>
        <p className='text-sm text-gray-700'>First section</p>
      </div>
      <Divider />
      <div>
        <p className='text-sm text-gray-700'>Second section</p>
      </div>
      <Divider />
      <div>
        <p className='text-sm text-gray-700'>Third section</p>
      </div>
      <Divider />
      <div>
        <p className='text-sm text-gray-700'>Fourth section</p>
      </div>
    </div>
  ),
}
