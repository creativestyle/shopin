/**
 * Homepage migration: create link entries, button entries, and all teaser/accordion entries.
 */
import type { PlainClientAPI } from 'contentful-management'
import type { EntryLinkRef } from '../../lib/links'
import { toEntryRef } from '../../lib/links'
import { createEntryWithLocales, createLinkEntries } from '../../lib/entries'
import { createImageAsset } from '../../lib/page-teasers'
import { LOCALES } from '../../lib/constants'
import {
  LINK_SHOP,
  LINK_NEW_ARRIVALS,
  LINK_SALE,
  SECTION_LINKS,
  getRichTeaser,
  PRODUCT_CAROUSEL,
  HEADLINE,
  BANNER,
  REGULAR,
  SLIDER_SLIDES,
  SLIDER_TITLE,
  SECTION,
  IMAGE_TEASER,
  CAROUSEL_ITEMS,
  CAROUSEL_TITLE,
  TEXT_TEASER,
  ACCORDION_ITEMS,
  ACCORDION_TITLE,
  BRAND_TITLE,
  BRAND,
  BRAND_IMAGES,
  VIDEO_TEASER,
  VIDEO_URLS,
} from './data'

export async function createLinks(client: PlainClientAPI) {
  const linkCId = await createEntryWithLocales(client, 'link', LINK_SHOP)
  const linkNewId = await createEntryWithLocales(
    client,
    'link',
    LINK_NEW_ARRIVALS
  )
  const linkSaleId = await createEntryWithLocales(client, 'link', LINK_SALE)
  const sectionLinkIds = await createLinkEntries(client, SECTION_LINKS)
  const sectionLinkRefs = sectionLinkIds.map((id) => toEntryRef(id))
  return { linkCId, linkNewId, linkSaleId, sectionLinkRefs }
}

const BUTTON_SPECS: Record<
  string,
  {
    'linkKey': 'linkCId' | 'linkNewId' | 'linkSaleId'
    'en-US': { name: string }
    'de-DE': { name: string }
  }
> = {
  buttonShopNowId: {
    'linkKey': 'linkCId',
    'en-US': { name: 'Shop now' },
    'de-DE': { name: 'Jetzt einkaufen' },
  },
  buttonViewCollectionId: {
    'linkKey': 'linkNewId',
    'en-US': { name: 'View collection' },
    'de-DE': { name: 'Kollektion ansehen' },
  },
  buttonExploreId: {
    'linkKey': 'linkNewId',
    'en-US': { name: 'Explore' },
    'de-DE': { name: 'Entdecken' },
  },
  buttonLearnMoreId: {
    'linkKey': 'linkSaleId',
    'en-US': { name: 'Learn more' },
    'de-DE': { name: 'Mehr erfahren' },
  },
  buttonShopNewArrivalsId: {
    'linkKey': 'linkNewId',
    'en-US': { name: 'Shop new arrivals' },
    'de-DE': { name: 'Neuheiten ansehen' },
  },
  buttonShopSaleId: {
    'linkKey': 'linkSaleId',
    'en-US': { name: 'Shop sale' },
    'de-DE': { name: 'Zum Sale' },
  },
}

export type CreatedButtons = {
  buttonShopNowId: string
  buttonViewCollectionId: string
  buttonExploreId: string
  buttonLearnMoreId: string
  buttonShopNewArrivalsId: string
  buttonShopSaleId: string
}

export async function createButtons(
  client: PlainClientAPI,
  links: { linkCId: string; linkNewId: string; linkSaleId: string }
): Promise<CreatedButtons> {
  const buttons = {} as CreatedButtons
  for (const [key, spec] of Object.entries(BUTTON_SPECS)) {
    const linkId = links[spec.linkKey]
    buttons[key as keyof CreatedButtons] = await createEntryWithLocales(
      client,
      'button',
      {
        'en-US': { name: spec['en-US'].name, link: toEntryRef(linkId) },
        'de-DE': { name: spec['de-DE'].name, link: toEntryRef(linkId) },
      }
    )
  }
  return buttons
}

export async function createTeasers(
  client: PlainClientAPI,
  links: {
    linkCId: string
    linkNewId: string
    linkSaleId: string
    sectionLinkRefs: EntryLinkRef[]
  },
  buttons: CreatedButtons,
  options?: { assetId?: string }
): Promise<string[]> {
  const HERO = {
    'en-US': {
      headline: 'Close to (your) nature',
      body: 'See our new collection made of recycled materials. Sustainable style for every day.',
      cta: toEntryRef(buttons.buttonShopNowId),
    },
    'de-DE': {
      headline: 'Nah an (deiner) Natur',
      body: 'Entdecke unsere neue Kollektion aus recycelten Materialien. Nachhaltiger Stil für jeden Tag.',
      cta: toEntryRef(buttons.buttonShopNowId),
    },
  }
  const componentIds: string[] = []
  componentIds.push(await createEntryWithLocales(client, 'teaserHero', HERO))
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserProductCarousel',
      PRODUCT_CAROUSEL
    )
  )
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserHeadline',
      HEADLINE(toEntryRef(buttons.buttonViewCollectionId))
    )
  )
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserBanner',
      BANNER(toEntryRef(buttons.buttonExploreId))
    )
  )
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserRegular',
      REGULAR(toEntryRef(buttons.buttonLearnMoreId))
    )
  )

  const sliderSlides = SLIDER_SLIDES(
    toEntryRef(buttons.buttonShopNewArrivalsId),
    toEntryRef(buttons.buttonViewCollectionId),
    toEntryRef(buttons.buttonShopSaleId)
  )
  const sliderItemIds: string[] = []
  for (const slide of sliderSlides) {
    sliderItemIds.push(
      await createEntryWithLocales(client, 'teaserCarouselItem', slide)
    )
  }
  componentIds.push(
    await createEntryWithLocales(client, 'teaserSlider', {
      'en-US': {
        ...SLIDER_TITLE['en-US'],
        slides: sliderItemIds.map((id) => toEntryRef(id)),
      },
      'de-DE': {
        ...SLIDER_TITLE['de-DE'],
        slides: sliderItemIds.map((id) => toEntryRef(id)),
      },
    })
  )
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserSection',
      SECTION(links.sectionLinkRefs)
    )
  )
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserImage',
      IMAGE_TEASER(toEntryRef(links.linkNewId))
    )
  )

  const carouselItems = CAROUSEL_ITEMS(
    toEntryRef(links.linkNewId),
    toEntryRef(links.linkCId),
    toEntryRef(links.linkSaleId)
  )
  const carouselItemIds: string[] = []
  for (const item of carouselItems) {
    carouselItemIds.push(
      await createEntryWithLocales(client, 'teaserCarouselItem', item)
    )
  }
  componentIds.push(
    await createEntryWithLocales(client, 'teaserCarousel', {
      'en-US': {
        ...CAROUSEL_TITLE['en-US'],
        carouselItems: carouselItemIds.map((id) => toEntryRef(id)),
      },
      'de-DE': {
        ...CAROUSEL_TITLE['de-DE'],
        carouselItems: carouselItemIds.map((id) => toEntryRef(id)),
      },
    })
  )
  componentIds.push(
    await createEntryWithLocales(client, 'teaserText', TEXT_TEASER)
  )
  componentIds.push(
    await createEntryWithLocales(
      client,
      'teaserRichText',
      getRichTeaser({ assetId: options?.assetId })
    )
  )

  const accordionItemIds: string[] = []
  for (const item of ACCORDION_ITEMS) {
    accordionItemIds.push(
      await createEntryWithLocales(client, 'accordionItem', item)
    )
  }
  const accordionId = await createEntryWithLocales(client, 'accordion', {
    'en-US': {
      ...ACCORDION_TITLE['en-US'],
      items: accordionItemIds.map((id) => toEntryRef(id)),
    },
    'de-DE': {
      ...ACCORDION_TITLE['de-DE'],
      items: accordionItemIds.map((id) => toEntryRef(id)),
    },
  })
  componentIds.push(
    await createEntryWithLocales(client, 'teaserAccordion', {
      'en-US': {
        ...ACCORDION_TITLE['en-US'],
        accordion: toEntryRef(accordionId),
      },
      'de-DE': {
        ...ACCORDION_TITLE['de-DE'],
        accordion: toEntryRef(accordionId),
      },
    })
  )

  const brandItemsId: string[] = []
  for (const item of BRAND) {
    const caption = String(
      item['en-US']?.caption ?? item['de-DE']?.caption ?? 'Brand image'
    )
    const imageUrl =
      BRAND_IMAGES[brandItemsId.length % BRAND_IMAGES.length] ?? ''
    const assetLink = {
      sys: {
        type: 'Link' as const,
        linkType: 'Asset' as const,
        id: await createImageAsset(
          client,
          {
            title: caption,
            url: imageUrl,
            fileName: `brand-item-${brandItemsId.length}.jpg`,
          },
          [...LOCALES]
        ),
      },
    }
    brandItemsId.push(
      await createEntryWithLocales(client, 'teaserBrandItem', {
        'en-US': {
          ...item['en-US'],
          image: assetLink,
          link: toEntryRef(links.linkCId),
        },
        'de-DE': {
          ...item['de-DE'],
          image: assetLink,
          link: toEntryRef(links.linkCId),
        },
      })
    )
  }

  componentIds.push(
    await createEntryWithLocales(client, 'teaserBrand', {
      'en-US': {
        ...BRAND_TITLE['en-US'],
        brandItems: brandItemsId.map((id) => toEntryRef(id)),
      },
      'de-DE': {
        ...BRAND_TITLE['de-DE'],
        brandItems: brandItemsId.map((id) => toEntryRef(id)),
      },
    })
  )

  const videoAssetId = await createImageAsset(
    client,
    {
      title: 'Video teaser',
      url: VIDEO_URLS[0] ?? '',
      fileName: 'video-teaser.mp4',
      contentType: 'video/mp4',
    },
    [...LOCALES]
  )
  const videoAssetLink = {
    sys: {
      type: 'Link' as const,
      linkType: 'Asset' as const,
      id: videoAssetId,
    },
  }
  const videoTeaser = VIDEO_TEASER(toEntryRef(links.linkNewId))
  componentIds.push(
    await createEntryWithLocales(client, 'teaserVideo', {
      'en-US': {
        ...videoTeaser['en-US'],
        video: videoAssetLink,
      },
      'de-DE': { ...videoTeaser['de-DE'], video: videoAssetLink },
    })
  )

  return componentIds
}
