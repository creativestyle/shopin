import type { Meta, StoryObj } from '@storybook/react'
import { useArgs } from 'storybook/preview-api'
import { ThumbnailSelector } from '@/components/ui/configurable-options/selectors/thumbnail-selector'

const meta: Meta<typeof ThumbnailSelector> = {
  title: 'Selectors/Thumbnail',
  component: ThumbnailSelector,
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: false },
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    // Storybook's render function is a valid hook call site per Storybook docs, but ESLint doesn't recognize it
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [{ value }, updateArgs] = useArgs()
    return (
      <ThumbnailSelector
        {...args}
        value={value}
        onChange={(newValue) => updateArgs({ value: newValue })}
      />
    )
  },
  args: {
    options: [
      { label: 'Variant 1', imageSrc: './product-image.png' },
      { label: 'Variant 2', imageSrc: './product-image.png' },
      {
        label: 'Variant 3',
        imageSrc: './product-image.png',
        disabled: true,
      },
    ],
    value: 'Variant 2',
  },
}
