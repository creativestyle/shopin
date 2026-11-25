/**
 * Populates the homepage with all typed components and images.
 * Data and logic live in homepage/* (data.ts, create-content.ts, attach-images.ts).
 */
import { getManagementClient } from '../lib/client'
import { DEFAULT_LOCALE, LOCALES } from '../lib/constants'
import { getLocalizedArrayLength, getEntryLinkIds } from '../lib/links'
import {
  getOrCreatePage,
  setPageComponents,
  attachImageToEntry,
  createImageAsset,
} from '../lib/page-teasers'
import { HOMEPAGE_PAGE, HOMEPAGE_IMAGES } from './homepage/data'
import {
  createLinks,
  createButtons,
  createTeasers,
} from './homepage/create-content'
import {
  attachImagesToMainTeasers,
  attachImagesToCarouselAndSliderItems,
} from './homepage/attach-images'

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  const { page } = await getOrCreatePage(client, 'homepage', HOMEPAGE_PAGE)
  if (getLocalizedArrayLength(page, 'components', DEFAULT_LOCALE) > 0) {
    throw new Error('Homepage already has components')
  }

  const richTextImageUrl =
    HOMEPAGE_IMAGES[0] ?? 'https://picsum.photos/seed/rich-text-demo/800/400'
  const richTextAssetId = await createImageAsset(
    client,
    {
      title: 'Rich text demo image',
      url: richTextImageUrl,
      fileName: 'rich-text-demo.jpg',
    },
    [...LOCALES]
  )

  const links = await createLinks(client)
  const buttons = await createButtons(client, links)

  let assetIndex = 0
  const nextUrl = () =>
    HOMEPAGE_IMAGES[assetIndex++ % HOMEPAGE_IMAGES.length] ?? ''
  const componentIds = await createTeasers(client, links, buttons, {
    assetId: richTextAssetId,
  })
  const updated = await setPageComponents(client, page, componentIds)

  const ids = getEntryLinkIds(updated, 'components', DEFAULT_LOCALE)
  if (ids.length === 0) {
    return
  }
  const result = await client.entry.getMany({
    query: { 'sys.id[in]': ids.join(','), 'limit': 100 },
  })
  const components = result.items ?? []
  if (components.length === 0) {
    return
  }

  await attachImagesToMainTeasers(client, components, nextUrl)
  await attachImagesToCarouselAndSliderItems(client, components, nextUrl)
  await attachImageToEntry(client, updated.sys.id, 'ogImage', [...LOCALES], {
    title: 'Homepage OG',
    url: HOMEPAGE_IMAGES[1] ?? 'https://picsum.photos/seed/og-home/1200/630',
    fileName: 'homepage-og.jpg',
  })
}

export = run
