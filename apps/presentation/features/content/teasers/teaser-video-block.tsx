import type { VideoTeaser } from '@core/contracts/content/teaser-video'
import { LazyVideo } from './lazy-video'
import { CmsLink } from '../cms-link'

interface TeaserVideoProps {
  teaser: VideoTeaser
  imagePreload?: boolean
}

export function TeaserVideoBlock({ teaser, imagePreload }: TeaserVideoProps) {
  const {
    title,
    caption,
    videoUrl,
    thumbnailUrl,
    captionsUrl,
    autoplay,
    controls,
    link,
  } = teaser
  if (!videoUrl) {
    return null
  }
  // Whole-block link only for ambient video, where it can't cover a play button or controls
  const overlayLink =
    link && autoplay && !controls
      ? { ...link, ariaLabel: link.ariaLabel ?? link.label }
      : undefined
  const textLink = !overlayLink && link?.url && link.label ? link : undefined
  const hasFigcaption = Boolean(title || caption || textLink)

  return (
    <figure>
      <div className='relative'>
        {overlayLink && (
          <CmsLink
            link={overlayLink}
            className='absolute inset-0 z-10'
            useLabelAsFallbackContent={false}
          />
        )}
        <LazyVideo
          src={videoUrl}
          poster={thumbnailUrl}
          captionsUrl={captionsUrl}
          title={title}
          autoPlay={autoplay}
          controls={controls}
          eager={imagePreload}
        />
      </div>
      {hasFigcaption && (
        <figcaption className='mt-4'>
          {title && (
            <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
          )}
          {caption && <p className='mt-1 text-sm text-gray-600'>{caption}</p>}
          {textLink && (
            <CmsLink
              link={textLink}
              className='mt-2 inline-block text-sm font-medium text-primary underline'
            />
          )}
        </figcaption>
      )}
    </figure>
  )
}
