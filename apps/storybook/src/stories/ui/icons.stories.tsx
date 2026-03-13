import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { loadIcons } from '../../utils/icon-loader'

const icons = loadIcons()

const meta: Meta = {
  title: 'UI/Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'All available SVG icons in the design system.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {
  render: () => (
    <div className='p-6'>
      <h1 className='mb-6 text-2xl font-bold'>
        Icon Library ({icons.length} icons)
      </h1>
      <div className='grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6'>
        {icons.map(({ name, Component }) => (
          <div
            key={name}
            className='flex flex-col items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300'
          >
            <div className='mb-2 flex size-12 items-center justify-center'>
              <Component className='size-8 text-gray-700' />
            </div>
            <span className='text-center text-sm font-medium text-gray-600'>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
}
