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
    <div className='relative rounded-lg'>
      {backgroundImage && (
        <div className='relative w-full overflow-hidden rounded-lg sm:aspect-[3/1] sm:min-h-[320px]'>
          <ContentImage
            image={backgroundImage}
            fill={false}
            className='block h-auto w-full sm:absolute sm:inset-0 sm:h-full sm:w-full sm:object-cover'
            preload={imagePreload}
            sizes='(min-width: 1920px) 1920px, 100vw'
          />
        </div>
      )}
      <div
        className={cn('flex flex-col items-center', {
          'sm:absolute sm:inset-0 sm:justify-end sm:px-6': hasOverlay,
          'p-8': !hasOverlay,
        })}
      >
        <div
          className={cn({
            '-mb-4 glass-filter px-6 py-4 text-center text-white max-sm:mx-4 max-sm:-mt-12 max-sm:mb-0 max-sm:self-stretch max-sm:!shadow-none sm:w-auto sm:px-12 sm:py-6':
              hasOverlay,
          })}
        >
          {headline && (
            <h2 className='text-2xl font-bold md:text-3xl'>{headline}</h2>
          )}
          {body && (
            <p
              className={cn('mx-auto mt-2 max-w-xl', {
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
    </div>
  )
}
