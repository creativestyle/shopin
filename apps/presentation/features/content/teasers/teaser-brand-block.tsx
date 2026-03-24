'use client'

import { ContentImage } from '@/features/content/content-image'
import { CmsLink } from '@/features/content/cms-link'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import type { BrandTeaser } from '@core/contracts/content/teaser-brand'
import type { TeaserBrandItem } from '@core/contracts/content/teaser-brand-item'
import {
  BRAND_CAROUSEL_GRID_CONFIG,
  BRAND_CAROUSEL_PRELOAD_ITEM_COUNT,
} from '../lib/brand-grid-config'

function TeaserBrandItemContent({
  item,
  preload,
}: {
  item: TeaserBrandItem
  preload?: boolean
}) {
  return (
    <>
      {item.image && (
        <div className='relative aspect-4/3 w-full overflow-hidden rounded-t-lg'>
          <ContentImage
            image={item.image}
            fill
            className='object-cover'
            sizes='300px'
            preload={preload}
          />
        </div>
      )}
    </>
  )
}

export function TeaserBrandBlock({
  teaser,
  imagePreload,
  carouselId,
}: {
  teaser: BrandTeaser
  imagePreload?: boolean
  carouselId?: string
}) {
  const { title, items } = teaser
  if (!items?.length) {
    return null
  }

  return (
    <div className='space-y-2'>
      {title && (
        <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
      )}
      <Carousel
        id={carouselId}
        gridConfig={BRAND_CAROUSEL_GRID_CONFIG}
        className='gap-4'
      >
        {items.map((item, index) => (
          <CarouselSlide key={index}>
            <Card
              scheme='gray'
              className='h-full overflow-hidden p-0'
            >
              {item.link?.url ? (
                <CmsLink
                  link={item.link}
                  className='block'
                >
                  <TeaserBrandItemContent
                    item={item}
                    preload={
                      imagePreload &&
                      index < BRAND_CAROUSEL_PRELOAD_ITEM_COUNT
                    }
                  />
                </CmsLink>
              ) : (
                <TeaserBrandItemContent
                  item={item}
                  preload={
                    imagePreload && index < BRAND_CAROUSEL_PRELOAD_ITEM_COUNT
                  }
                />
              )}
            </Card>
          </CarouselSlide>
        ))}
      </Carousel>
    </div>
  )
}
