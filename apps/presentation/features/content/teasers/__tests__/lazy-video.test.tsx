import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { LazyVideo } from '../lazy-video'

const SRC = 'https://videos.ctfassets.net/space/video.mp4'
const POSTER = 'https://images.ctfassets.net/space/poster.jpg'

function getVideo(container: HTMLElement) {
  const video = container.querySelector('video')
  if (!video) {
    throw new Error('video element not rendered')
  }
  return video
}

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  })
}

describe('LazyVideo', () => {
  let play: jest.SpyInstance
  let pause: jest.SpyInstance

  beforeEach(() => {
    play = jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    pause = jest
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    // @ts-expect-error jsdom has no matchMedia; tests add it per case
    delete window.matchMedia
  })

  describe('click to play', () => {
    it('shows the poster and a labelled play button without controls before playback', () => {
      const { container } = render(
        <LazyVideo
          src={SRC}
          poster={POSTER}
          title='Spring campaign'
          eager
        />
      )

      expect(
        screen.getByRole('button', { name: 'teaser.video.playTitled' })
      ).toBeInTheDocument()
      expect(container.querySelector('img')).toBeInTheDocument()
      expect(getVideo(container)).not.toHaveAttribute('controls')
      expect(play).not.toHaveBeenCalled()
    })

    it('plays on click, keeps the poster until playback starts, then shows controls', async () => {
      const { container } = render(
        <LazyVideo
          src={SRC}
          poster={POSTER}
          eager
        />
      )
      const video = getVideo(container)

      await userEvent.click(
        screen.getByRole('button', { name: 'teaser.video.play' })
      )

      expect(play).toHaveBeenCalledTimes(1)
      expect(
        screen.queryByRole('button', { name: 'teaser.video.play' })
      ).not.toBeInTheDocument()
      expect(container.querySelector('img')).toBeInTheDocument()
      expect(video).toHaveAttribute('controls')

      fireEvent.playing(video)

      expect(container.querySelector('img')).not.toBeInTheDocument()
    })

    it('shows the play button again when playback is rejected', async () => {
      play.mockRejectedValue(new Error('NotAllowedError'))
      render(
        <LazyVideo
          src={SRC}
          poster={POSTER}
          eager
        />
      )

      await userEvent.click(
        screen.getByRole('button', { name: 'teaser.video.play' })
      )

      expect(
        await screen.findByRole('button', { name: 'teaser.video.play' })
      ).toBeInTheDocument()
    })
  })

  describe('autoplay', () => {
    it('starts muted without a click and offers a pause toggle', async () => {
      const { container } = render(
        <LazyVideo
          src={SRC}
          poster={POSTER}
          autoPlay
          eager
        />
      )
      const video = getVideo(container)

      await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
      expect(video.muted).toBe(true)
      expect(video).not.toHaveAttribute('controls')

      fireEvent.playing(video)

      const toggle = screen.getByRole('button', { name: 'teaser.video.pause' })
      jest
        .spyOn(HTMLMediaElement.prototype, 'paused', 'get')
        .mockReturnValue(false)
      await userEvent.click(toggle)

      expect(pause).toHaveBeenCalledTimes(1)

      fireEvent.pause(video)

      expect(
        screen.getByRole('button', { name: 'teaser.video.play' })
      ).toBeInTheDocument()
    })

    it('falls back to click to play when the browser blocks autoplay', async () => {
      play.mockRejectedValueOnce(new Error('NotAllowedError'))
      const { container } = render(
        <LazyVideo
          src={SRC}
          poster={POSTER}
          autoPlay
          eager
        />
      )

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'teaser.video.play' })
        ).toHaveClass('inset-0')
      )
      expect(screen.getAllByRole('button')).toHaveLength(1)
      expect(container.querySelector('img')).toBeInTheDocument()
    })

    it('does not start on its own when reduced motion is requested', () => {
      mockReducedMotion(true)
      const { container } = render(
        <LazyVideo
          src={SRC}
          poster={POSTER}
          autoPlay
          eager
        />
      )

      expect(play).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', { name: 'teaser.video.play' })
      ).toHaveClass('inset-0')
      expect(getVideo(container)).not.toHaveAttribute('controls')
    })

    it('does not start during hydration when reduced motion is requested', async () => {
      const video = (
        <LazyVideo
          src={SRC}
          poster={POSTER}
          autoPlay
          eager
        />
      )
      const container = document.createElement('div')
      container.innerHTML = renderToString(video)
      // Browsers set the property from the parsed attribute; jsdom doesn't
      container.querySelector('video')!.muted = true
      document.body.appendChild(container)
      mockReducedMotion(true)

      let root: Root | undefined
      try {
        await act(async () => {
          root = hydrateRoot(container, video)
        })

        expect(play).not.toHaveBeenCalled()
        expect(
          screen.getByRole('button', { name: 'teaser.video.play' })
        ).toHaveClass('inset-0')
      } finally {
        act(() => root?.unmount())
        container.remove()
      }
    })

    it('leaves pausing to the native controls when the CMS enables them', async () => {
      render(
        <LazyVideo
          src={SRC}
          autoPlay
          controls
          eager
        />
      )

      await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('captions', () => {
    it('adds a captions track in the active locale and requests media with CORS', () => {
      const { container } = render(
        <LazyVideo
          src={SRC}
          captionsUrl='https://assets.ctfassets.net/space/captions.vtt'
          eager
        />
      )

      const track = container.querySelector('track')
      expect(track).toHaveAttribute('kind', 'captions')
      expect(track).toHaveAttribute('srclang', 'en')
      expect(track).toHaveAttribute('label', 'teaser.video.captions')
      expect(getVideo(container)).toHaveAttribute('crossorigin', 'anonymous')
    })

    it('does not request media with CORS without captions', () => {
      const { container } = render(
        <LazyVideo
          src={SRC}
          eager
        />
      )

      expect(container.querySelector('track')).not.toBeInTheDocument()
      expect(getVideo(container)).not.toHaveAttribute('crossorigin')
    })
  })
})
