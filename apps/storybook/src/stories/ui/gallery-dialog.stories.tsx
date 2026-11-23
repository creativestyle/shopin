import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  GalleryDialog,
  type GalleryDialogProps,
} from '@/components/ui/gallery-dialog'
import { Button } from '@/components/ui/button'

const createImages = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    src: './product-image.png',
    alt: `Image ${i + 1}`,
  }))

const meta: Meta<typeof GalleryDialog> = {
  title: 'UI/GalleryDialog',
  component: GalleryDialog,
  tags: ['autodocs'],
  args: {
    images: createImages(10),
    startIndex: 0,
  },
  argTypes: {
    isOpen: { control: false },
    onClose: { control: false },
  },
  render: (args) => <GalleryDialogStory {...args} />,
}

export default meta
type Story = StoryObj<typeof meta>

function GalleryDialogStory(args: GalleryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Gallery</Button>
      <GalleryDialog
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

export const Default: Story = {}

export const FewImages: Story = {
  args: {
    images: createImages(4),
  },
}
