import type { Meta, StoryObj } from '@storybook/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'

const meta = {
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
      description: 'Seconds for one full rotation',
    },
  },
  args: {
    speed: 1,
  },
} satisfies Meta<typeof LoadingSpinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <LoadingSpinner
      className='size-12'
      {...args}
    />
  ),
}

export const InButton: Story = {
  name: 'In button',
  render: (args) => (
    <div className='flex flex-wrap items-center justify-center gap-3'>
      <Button
        className='min-w-36 justify-center py-2'
        disabled
      >
        <LoadingSpinner
          className='size-8'
          {...args}
        />
      </Button>
      <Button
        variant='secondary'
        className='min-w-36 justify-center py-2'
        disabled
      >
        <LoadingSpinner
          className='size-8'
          {...args}
        />
      </Button>
    </div>
  ),
}

const SIZES = [
  { label: '16px', className: 'size-4' },
  { label: '24px', className: 'size-6' },
  { label: '32px', className: 'size-8' },
  { label: '48px', className: 'size-12' },
] as const

const SPEEDS = [
  { label: '0.5s', speed: 0.5 },
  { label: '1s', speed: 1 },
  { label: '2s', speed: 2 },
] as const

export const SizesAndSpeed: Story = {
  name: 'Sizes & speed',
  argTypes: {
    speed: { table: { disable: true } },
  },
  render: () => (
    <div className='grid w-full max-w-xl gap-8 sm:grid-cols-2'>
      <section className='min-w-0'>
        <h3 className='mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase'>
          Sizes
        </h3>
        <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'>
          <ul className='divide-y divide-gray-100'>
            {SIZES.map(({ label, className }) => (
              <li
                key={label}
                className='flex items-center justify-between gap-4 px-4 py-3'
              >
                <span className='font-mono text-sm text-gray-950 tabular-nums'>
                  {label}
                </span>
                <span className='flex h-12 w-14 shrink-0 items-center justify-center'>
                  <LoadingSpinner className={className} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className='min-w-0'>
        <h3 className='mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase'>
          Rotation period
        </h3>
        <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'>
          <ul className='divide-y divide-gray-100'>
            {SPEEDS.map(({ label, speed }) => (
              <li
                key={label}
                className='flex items-center justify-between gap-4 px-4 py-3'
              >
                <span className='font-mono text-sm text-gray-950 tabular-nums'>
                  {label}
                  <span className='ml-1 font-sans text-xs font-normal text-gray-500'>
                    / turn
                  </span>
                </span>
                <span className='flex h-12 w-14 shrink-0 items-center justify-center'>
                  <LoadingSpinner
                    className='size-8'
                    speed={speed}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  ),
}
