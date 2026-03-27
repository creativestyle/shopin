import type { VideoTeaser } from '@core/contracts/content/teaser-video'
import { LazyVideo } from './lazy-video'
import { CmsLink } from '../cms-link'

interface TeaserVideoProps {
  teaser: VideoTeaser
  imagePreload?: boolean
}

export function TeaserVideoBlock({ teaser, imagePreload }: TeaserVideoProps) {
  const { videoUrl, thumbnailUrl, autoplay, controls, link } = teaser
  return (
    <div className='relative'>
      {link && (
        <CmsLink
          link={link}
          className='absolute inset-0 z-10'
          aria-label={link.title}
        />
      )}
      <LazyVideo
        src={videoUrl}
        poster={thumbnailUrl}
        autoPlay={autoplay}
        muted={autoplay}
        controls={controls}
        eager={imagePreload}
      />
    </div>
  )
}
