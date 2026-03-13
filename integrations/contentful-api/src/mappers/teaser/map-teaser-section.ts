import type { SectionTeaser } from '@core/contracts/content/teaser-section'
import type { CmsLinkResponse } from '@core/contracts/content/cms-link'
import type { TeaserSectionApiResponse } from '../../schemas/teaser/teaser-section'
import { mapLinkEntryToCmsLink } from '../cms-link'
import { mapContentfulImageToContentImage } from '../content-image'

/** Maps Contentful TeaserSection entry to contract SectionTeaser. */
export function mapTeaserSection(
  entry: TeaserSectionApiResponse
): SectionTeaser {
  const subcategoryLinkEntries = entry.subcategoryLinkEntriesCollection?.items
  const subcategoryLinks = (subcategoryLinkEntries ?? [])
    .map((linkEntry) => mapLinkEntryToCmsLink(linkEntry))
    .filter((link): link is CmsLinkResponse => link != null)
  return {
    type: 'section',
    categoryLabel: entry.categoryLabel ?? undefined,
    headline: entry.headline ?? undefined,
    body: entry.body ?? undefined,
    subcategoryLinks:
      subcategoryLinks.length > 0 ? subcategoryLinks : undefined,
    image: mapContentfulImageToContentImage(entry.image),
  }
}
