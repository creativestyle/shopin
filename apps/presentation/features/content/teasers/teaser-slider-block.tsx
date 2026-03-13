'use client'

import { ContentImage } from '@/features/content/content-image'
import { CmsLink } from '@/features/content/cms-link'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import { CmsButton } from '@/features/content/cms-button'
import { cn } from '@/lib/utils'
import type { SliderTeaser } from '@core/contracts/content/teaser-slider'
import type { TeaserCarouselItem } from '@core/contracts/content/teaser-carousel-item'

function isHeroSlide(item: TeaserCarouselItem): boolean {
  return !!(item.headline || item.body || item.cta?.link?.url)
}

export function TeaserSliderBlock({
  teaser,
  carouselId,
  imagePreload,
}: {
  teaser: SliderTeaser
  carouselId?: string
  imagePreload?: boolean
}) {
  const { title, items } = teaser
  if (!items?.length) {
    return null
  }

  const itemsWithMeta = items.map((item) => ({
    item,
    isHero: isHeroSlide(item),
  }))
  const hasHeroSlides = itemsWithMeta.some((x) => x.isHero)

  return (
    <div className='space-y-2'>
      {title && (
        <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
      )}
      <Carousel
        id={carouselId}
        className={cn({
          'min-h-[320px] sm:min-h-[360px] md:min-h-[400px]': hasHeroSlides,
        })}
        gridConfig={{
          'base': 1,
          'sm': 1,
          'md': 1,
          'lg': 1,
          'xl': 1,
          '2xl': 1,
        }}
      >
        {itemsWithMeta.map(({ item, isHero }, index) => (
          <CarouselSlide key={index}>
            <div
              className={cn(
                'flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-lg bg-gray-100 sm:min-h-[360px] md:min-h-[400px]'
              )}
            >
              {isHero ? (
                <SliderHeroSlideContent
                  item={item}
                  preload={imagePreload && index === 0}
                />
              ) : item.link?.url ? (
                <CmsLink
                  link={item.link}
                  className='block flex-1'
                >
                  <SliderCaptionSlideContent
                    item={item}
                    preload={imagePreload && index === 0}
                  />
                </CmsLink>
              ) : (
                <SliderCaptionSlideContent
                  item={item}
                  preload={imagePreload && index === 0}
                />
              )}
            </div>
          </CarouselSlide>
        ))}
      </Carousel>
    </div>
  )
}

function SliderHeroSlideContent({
  item,
  preload,
}: {
  item: TeaserCarouselItem
  preload?: boolean
}) {
  const imageUrl = item.image?.url
  return (
    <section
      className={cn(
        'relative h-full min-h-[320px] w-full overflow-hidden sm:min-h-[360px] md:min-h-[400px]',
        { 'md:aspect-[1920/523]': imageUrl }
      )}
      aria-label={item.headline}
    >
      {item.image && (
        <div className='absolute inset-0'>
          <ContentImage
            image={item.image}
            fill
            className='object-cover'
            sizes='(min-width: 1920px) 1920px, 100vw'
            preload={preload}
          />
          <div
            className='absolute inset-0 bg-black/40'
            aria-hidden
          />
        </div>
      )}
      <div
        className={cn(
          'z-10 flex flex-col items-center justify-center px-4 text-center sm:px-6',
          {
            'absolute inset-0 py-6 text-white sm:py-8': imageUrl,
            'relative min-h-[320px] py-12 sm:min-h-[360px] md:min-h-[400px]':
              !imageUrl,
          }
        )}
      >
        {item.headline && (
          <h2 className='text-2xl font-bold tracking-tight drop-shadow-sm sm:text-3xl md:text-4xl'>
            {item.headline}
          </h2>
        )}
        {item.body && (
          <p
            className={cn({
              'mt-2 max-w-xl text-base opacity-95 drop-shadow-sm sm:mt-3 sm:text-lg':
                imageUrl,
              'mt-3 max-w-2xl text-lg text-gray-700': !imageUrl,
            })}
          >
            {item.body}
          </p>
        )}
        {item.cta?.link?.url && (
          <CmsButton
            cta={item.cta}
            className={cn({
              'mt-4 sm:mt-5': imageUrl,
              'mt-5': !imageUrl,
            })}
          />
        )}
      </div>
    </section>
  )
}

function SliderCaptionSlideContent({
  item,
  preload,
}: {
  item: TeaserCarouselItem
  preload?: boolean
}) {
  return (
    <>
      {item.image && (
        <div className='relative aspect-[16/9] w-full overflow-hidden'>
          <ContentImage
            image={item.image}
            fill
            className='object-cover'
            sizes='(min-width: 1920px) 1920px, 100vw'
            preload={preload}
          />
        </div>
      )}
      {item.caption && (
        <div className='p-4'>
          <p className='text-gray-700'>{item.caption}</p>
        </div>
      )}
    </>
  )
}
