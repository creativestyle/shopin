import type { ReactNode } from 'react'
import type { TeaserResponse } from '@core/contracts/content/teaser'
import { isTeaserOfType } from '@core/contracts/content/teaser'
import { TeaserImageBlock } from './teaser-image-block'
import { TeaserCarouselBlock } from './teaser-carousel-block'
import { TeaserHeadlineBlock } from './teaser-headline-block'
import { TeaserTextBlock } from './teaser-text-block'
import { TeaserRichTextBlock } from './teaser-rich-text-block'
import { TeaserBannerBlock } from './teaser-banner-block'
import { TeaserHeroBlock } from './teaser-hero-block'
import { TeaserProductCarouselBlock } from './teaser-product-carousel-block'
import { TeaserSliderBlock } from './teaser-slider-block'
import { TeaserSectionBlock } from './teaser-section-block'
import { TeaserRegularBlock } from './teaser-regular-block'
import { TeaserAccordionBlock } from './teaser-accordion-block'
import { TeaserBrandBlock } from './teaser-brand-block'

function renderTeaser(
  teaser: TeaserResponse,
  index?: number,
  imagePreload?: boolean
): ReactNode {
  if (isTeaserOfType(teaser, 'accordion')) {
    return (
      <TeaserAccordionBlock
        teaser={teaser}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'banner')) {
    return (
      <TeaserBannerBlock
        teaser={teaser}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'carousel')) {
    return (
      <TeaserCarouselBlock
        teaser={teaser}
        imagePreload={imagePreload}
        carouselId={index !== undefined ? `carousel-${index}` : undefined}
      />
    )
  }
  if (isTeaserOfType(teaser, 'headline')) {
    return <TeaserHeadlineBlock teaser={teaser} />
  }
  if (isTeaserOfType(teaser, 'hero')) {
    return <TeaserHeroBlock teaser={teaser} />
  }
  if (isTeaserOfType(teaser, 'image')) {
    return (
      <TeaserImageBlock
        teaser={teaser}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'productCarousel')) {
    return (
      <TeaserProductCarouselBlock
        teaser={teaser}
        carouselId={
          index !== undefined ? `product-carousel-${index}` : undefined
        }
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'regular')) {
    return (
      <TeaserRegularBlock
        teaser={teaser}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'richText')) {
    return (
      <TeaserRichTextBlock
        teaser={teaser}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'section')) {
    return (
      <TeaserSectionBlock
        teaser={teaser}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'slider')) {
    return (
      <TeaserSliderBlock
        teaser={teaser}
        carouselId={index !== undefined ? `carousel-${index}` : undefined}
        imagePreload={imagePreload}
      />
    )
  }
  if (isTeaserOfType(teaser, 'text')) {
    return <TeaserTextBlock teaser={teaser} />
  }
  if (isTeaserOfType(teaser, 'brand')) {
    return (
      <TeaserBrandBlock
        teaser={teaser}
        imagePreload={imagePreload}
        carouselId={index !== undefined ? `brand-carousel-${index}` : undefined}
      />
    )
  }
  return null
}

export function TeaserBlock({
  teaser,
  index = 0,
  imagePreload = false,
}: {
  teaser: TeaserResponse
  index?: number
  imagePreload?: boolean
}) {
  return renderTeaser(teaser, index, imagePreload)
}
