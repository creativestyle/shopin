import type { VideoTeaser } from '@core/contracts/content/teaser-video'
import type { TeaserVideoApiResponse } from '../../schemas/teaser/teaser-video'
import { mapLinkEntryToCmsLink } from '../cms-link'

/** Maps Contentful TeaserVideo entry to contract VideoTeaser. */
export function mapTeaserVideo(entry: TeaserVideoApiResponse): VideoTeaser {
  return {
    type: 'video',
    title: entry.title ?? undefined,
    videoUrl: entry.video?.url ?? undefined,
    thumbnailUrl: entry.thumbnail?.url ?? undefined,
    autoplay: entry.autoplay ?? false,
    controls: entry.controls ?? true,
    caption: entry.caption ?? undefined,
    link: mapLinkEntryToCmsLink(entry.link),
  }
}
