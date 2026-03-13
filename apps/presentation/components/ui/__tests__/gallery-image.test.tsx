import { render, screen, fireEvent } from '@testing-library/react'
import { GalleryImage } from '@/components/ui/gallery-image'

describe('GalleryImage', () => {
  it('calls onZoom when clicked and when pressing Enter', () => {
    const onZoom = jest.fn()
    render(
      <GalleryImage
        src='/img.jpg'
        alt='alt'
        onZoom={onZoom}
      />
    )

    const container = screen.getByRole('button')
    fireEvent.click(container)
    expect(onZoom).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(container, { key: 'Enter' })
    expect(onZoom).toHaveBeenCalledTimes(2)
  })
})
