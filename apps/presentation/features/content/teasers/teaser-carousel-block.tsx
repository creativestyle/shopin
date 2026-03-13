'use client'

import { ContentImage } from '@/features/content/content-image'
import { CmsLink } from '@/features/content/cms-link'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import type { CarouselTeaser } from '@core/contracts/content/teaser-carousel'
import type { TeaserCarouselItem } from '@core/contracts/content/teaser-carousel-item'
import {
  CONTENT_CAROUSEL_GRID_CONFIG,
  CONTENT_CAROUSEL_PRELOAD_ITEM_COUNT,
} from '../lib/carousel-grid-config'

function TeaserCarouselItemContent({
  item,
  preload,
}: {
  item: TeaserCarouselItem
  preload?: boolean
}) {
  return (
    <>
      {item.image && (
        <div className='relative aspect-[4/3] w-full overflow-hidden rounded-t-lg'>
          <ContentImage
            image={item.image}
            fill
            className='object-cover'
            sizes='280px'
            preload={preload}
          />
        </div>
      )}
      {item.caption && (
        <div className='p-3'>
          <p className='text-sm text-gray-600'>{item.caption}</p>
        </div>
      )}
    </>
  )
}

export function TeaserCarouselBlock({
  teaser,
  imagePreload,
  carouselId,
}: {
  teaser: CarouselTeaser
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
        gridConfig={CONTENT_CAROUSEL_GRID_CONFIG}
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
                  <TeaserCarouselItemContent
                    item={item}
                    preload={
                      imagePreload &&
                      index < CONTENT_CAROUSEL_PRELOAD_ITEM_COUNT
                    }
                  />
                </CmsLink>
              ) : (
                <TeaserCarouselItemContent
                  item={item}
                  preload={
                    imagePreload && index < CONTENT_CAROUSEL_PRELOAD_ITEM_COUNT
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
