import type { Meta, StoryObj } from '@storybook/react'
import { ConfigurableOptions } from '@/components/ui/configurable-options/configurable-options'

const meta: Meta<typeof ConfigurableOptions> = {
  title: 'Selectors/ConfigurableOptions',
  component: ConfigurableOptions,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className='max-w-md p-4'>
      <ConfigurableOptions
        options={[
          {
            key: 'color',
            label: 'Color',
            type: 'color',
            options: [
              { label: 'Black', swatch: '#000000' },
              { label: 'White', swatch: '#FFFFFF' },
              { label: 'Red', swatch: '#FF0000' },
            ],
          },
          {
            key: 'size',
            label: 'Size',
            type: 'string',
            options: [{ label: 'S' }, { label: 'M' }, { label: 'L' }],
          },
        ]}
      />
    </div>
  ),
}
