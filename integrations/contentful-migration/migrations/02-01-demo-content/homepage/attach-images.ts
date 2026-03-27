/**
 * Homepage migration: attach images to teaser entries and page ogImage.
 */
import type { PlainClientAPI } from 'contentful-management'
import type { EntryProps } from 'contentful-management'
import { LOCALES, DEFAULT_LOCALE } from '../../lib/constants'
import { getEntryLinkIds } from '../../lib/links'
import {
  attachImageToEntry,
  attachImageToEntryFromLocalFile,
} from '../../lib/page-teasers'

function getContentTypeId(entry: EntryProps): string | undefined {
  const sys = entry.sys?.contentType?.sys as { id?: string } | undefined
  return sys?.id
}

export type HeroBackgroundLocalFile = {
  absolutePath: string
  fileName: string
  title?: string
}

export async function attachImagesToMainTeasers(
  client: PlainClientAPI,
  components: EntryProps[],
  nextUrl: () => string,
  options?: { heroBackgroundLocalFile?: HeroBackgroundLocalFile }
) {
  for (const entry of components) {
    const ct = getContentTypeId(entry)
    if (ct === 'teaserBanner') {
      await attachImageToEntry(
        client,
        entry.sys.id,
        'backgroundImage',
        [...LOCALES],
        {
          title: 'Banner hero',
          url: nextUrl(),
          fileName: `teaser-${entry.sys.id}.jpg`,
        }
      )
    } else if (ct === 'teaserHero') {
      const heroLocal = options?.heroBackgroundLocalFile
      if (heroLocal) {
        await attachImageToEntryFromLocalFile(
          client,
          entry.sys.id,
          'backgroundImage',
          [...LOCALES],
          {
            title:
              heroLocal.title ??
              String(entry.fields?.headline?.[DEFAULT_LOCALE] ?? 'Hero'),
            absoluteFilePath: heroLocal.absolutePath,
            fileName: heroLocal.fileName,
          }
        )
      } else {
        await attachImageToEntry(
          client,
          entry.sys.id,
          'backgroundImage',
          [...LOCALES],
          {
            title: String(entry.fields?.headline?.[DEFAULT_LOCALE] ?? 'Hero'),
            url: nextUrl(),
            fileName: `teaser-${entry.sys.id}.jpg`,
          }
        )
      }
    } else if (ct === 'teaserImage') {
      await attachImageToEntry(client, entry.sys.id, 'image', [...LOCALES], {
        title: String(entry.fields?.title?.[DEFAULT_LOCALE] ?? 'Teaser image'),
        url: nextUrl(),
        fileName: `teaser-${entry.sys.id}.jpg`,
      })
    } else if (ct === 'teaserSection') {
      await attachImageToEntry(client, entry.sys.id, 'image', [...LOCALES], {
        title: String(
          entry.fields?.headline?.[DEFAULT_LOCALE] ?? 'Section image'
        ),
        url: nextUrl(),
        fileName: `teaser-${entry.sys.id}.jpg`,
      })
    } else if (ct === 'teaserRegular') {
      await attachImageToEntry(client, entry.sys.id, 'image', [...LOCALES], {
        title: String(
          entry.fields?.headline?.[DEFAULT_LOCALE] ?? 'Regular teaser'
        ),
        url: nextUrl(),
        fileName: `teaser-${entry.sys.id}.jpg`,
      })
    }
  }
}

export async function attachImagesToCarouselAndSliderItems(
  client: PlainClientAPI,
  components: EntryProps[],
  nextUrl: () => string
) {
  const ids: string[] = []
  for (const entry of components) {
    const ct = getContentTypeId(entry)
    if (ct === 'teaserCarousel') {
      ids.push(...getEntryLinkIds(entry, 'carouselItems', DEFAULT_LOCALE))
    } else if (ct === 'teaserSlider') {
      ids.push(...getEntryLinkIds(entry, 'slides', DEFAULT_LOCALE))
    }
  }
  if (ids.length === 0) {
    return
  }
  const res = await client.entry.getMany({
    query: { 'sys.id[in]': ids.join(','), 'limit': 100 },
  })
  for (const item of res.items ?? []) {
    await attachImageToEntry(client, item.sys.id, 'image', [...LOCALES], {
      title: String(item.fields?.caption?.[DEFAULT_LOCALE] ?? 'Carousel image'),
      url: nextUrl(),
      fileName: `teaser-${item.sys.id}.jpg`,
    })
  }
}
