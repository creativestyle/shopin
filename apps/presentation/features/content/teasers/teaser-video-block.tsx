import type { VideoTeaser } from '@core/contracts/content/teaser-video'
import { CmsLink } from '@/features/content/cms-link'
import { LazyVideo } from './lazy-video'

interface TeaserVideoProps {
  teaser: VideoTeaser
  imagePreload?: boolean
}

export function TeaserVideoBlock({ teaser, imagePreload }: TeaserVideoProps) {
  const { videoUrl, thumbnailUrl, autoplay, controls, link } = teaser
  const video = (
    <LazyVideo
      src={videoUrl}
      poster={thumbnailUrl}
      autoPlay={autoplay}
      muted={autoplay}
      controls={controls}
      eager={imagePreload}
    />
  )

  return link ? (
    <CmsLink
      link={link}
      className='block'
    >
      {video}
    </CmsLink>
  ) : (
    video
  )
}
