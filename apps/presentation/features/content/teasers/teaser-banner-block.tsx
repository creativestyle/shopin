import { ContentImage } from '@/features/content/content-image'
import { CmsButton } from '@/features/content/cms-button'
import { cn } from '@/lib/utils'
import type { BannerTeaser } from '@core/contracts/content/teaser-banner'

export function TeaserBannerBlock({
  teaser,
  imagePreload,
}: {
  teaser: BannerTeaser
  imagePreload?: boolean
}) {
  const { backgroundImage, headline, body, cta } = teaser
  const hasContent = headline || body || cta?.link?.url
  if (!hasContent && !backgroundImage?.url) {
    return null
  }

  const hasOverlay = Boolean(backgroundImage?.url)

  return (
    <div className='relative overflow-hidden rounded-lg'>
      {backgroundImage && (
        <div className='relative aspect-[3/1] min-h-[280px] w-full sm:min-h-[320px]'>
          <ContentImage
            image={backgroundImage}
            fill
            className='object-cover'
            preload={imagePreload}
            sizes='(min-width: 1920px) 1920px, 100vw'
          />
          <div className='absolute inset-0 bg-black/40' />
        </div>
      )}
      <div
        className={cn('flex flex-col items-center justify-center text-center', {
          'absolute inset-0 p-6 text-white': hasOverlay,
          'p-8': !hasOverlay,
        })}
      >
        {headline && (
          <h2 className='text-2xl font-bold md:text-3xl'>{headline}</h2>
        )}
        {body && (
          <p
            className={cn('mt-2 max-w-xl', {
              'opacity-90': hasOverlay,
              'text-gray-700': !hasOverlay,
            })}
          >
            {body}
          </p>
        )}
        {cta?.link?.url && (
          <CmsButton
            cta={cta}
            className='mt-4'
          />
        )}
      </div>
    </div>
  )
}
