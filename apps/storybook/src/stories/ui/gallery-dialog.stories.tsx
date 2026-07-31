import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { GalleryDialog } from '@/components/ui/gallery-dialog'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof GalleryDialog> = {
  title: 'UI/GalleryDialog',
  component: GalleryDialog,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const GalleryDialogStory = () => {
  const [isOpen, setIsOpen] = useState(false)
  const images = Array.from({ length: 10 }, (_, i) => ({
    src: './product-image.png',
    alt: `Image ${i + 1}`,
  }))

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Gallery</Button>
      <GalleryDialog
        images={images}
        startIndex={0}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

export const Default: Story = {
  render: () => <GalleryDialogStory />,
}
