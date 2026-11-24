import { render, screen } from '@testing-library/react'
import type { VideoTeaser } from '@core/contracts/content/teaser-video'
import { TeaserVideoBlock } from '../teaser-video-block'

const baseTeaser: VideoTeaser = {
  type: 'video',
  title: 'Spring campaign',
  videoUrl: 'https://videos.ctfassets.net/space/video.mp4',
  autoplay: false,
  controls: true,
  link: { url: '/spring', label: 'Shop the collection' },
}

describe('TeaserVideoBlock', () => {
  beforeEach(() => {
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders nothing without a video', () => {
    const { container } = render(
      <TeaserVideoBlock teaser={{ ...baseTeaser, videoUrl: undefined }} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the link below the video for a click-to-play video', () => {
    render(
      <TeaserVideoBlock
        teaser={baseTeaser}
        imagePreload
      />
    )

    const link = screen.getByRole('link', { name: 'Shop the collection' })
    expect(link).toHaveAttribute('href', '/spring')
    expect(link.closest('figcaption')).toBeInTheDocument()
  })

  it('makes the whole block a link for ambient autoplay video without controls', () => {
    render(
      <TeaserVideoBlock
        teaser={{ ...baseTeaser, autoplay: true, controls: false }}
        imagePreload
      />
    )

    const link = screen.getByRole('link', { name: 'Shop the collection' })
    expect(link).toHaveClass('absolute', 'inset-0')
    expect(link).toBeEmptyDOMElement()
    expect(link.closest('figcaption')).not.toBeInTheDocument()
  })
})
