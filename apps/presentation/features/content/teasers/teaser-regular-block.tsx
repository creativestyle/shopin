import { cn } from '@/lib/utils'
import { ContentImage } from '@/features/content/content-image'
import { CmsButton } from '@/features/content/cms-button'
import type { RegularTeaser } from '@core/contracts/content/teaser-regular'

export function TeaserRegularBlock({
  teaser,
  imagePreload,
}: {
  teaser: RegularTeaser
  imagePreload?: boolean
}) {
  const { image, categoryLabel, headline, body, cta } = teaser
  const hasImage = Boolean(image?.url)
  const hasRightContent = categoryLabel || headline || body || cta?.link?.url
  if (!hasRightContent && !hasImage) {
    return null
  }

  return (
    <section
      className='relative w-full overflow-hidden sm:min-h-[320px] md:min-h-[480px]'
      aria-label={headline ?? categoryLabel}
    >
      {hasImage && (
        <div className='relative w-full overflow-hidden max-sm:rounded-lg sm:absolute sm:inset-0'>
          <ContentImage
            image={image!}
            fill={false}
            className='block h-auto w-full sm:absolute sm:inset-0 sm:h-full sm:w-full sm:object-cover'
            sizes='(min-width: 1920px) 1920px, 100vw'
            preload={imagePreload}
          />
        </div>
      )}

      {hasRightContent && (
        <div className='flex flex-col sm:absolute sm:inset-0 sm:items-start sm:justify-end sm:px-6 sm:pb-8 md:justify-center md:px-10'>
          <div
            className={cn(
              'glass-filter px-4 py-4 text-white max-sm:mx-4 max-sm:self-stretch max-sm:!shadow-none sm:w-auto sm:px-8 sm:py-8 md:max-w-md md:px-8 md:py-10 lg:max-w-lg',
              { 'max-sm:-mt-12': hasImage }
            )}
          >
            {categoryLabel && (
              <span className='text-xs font-medium tracking-wider text-white/80 uppercase'>
                {categoryLabel}
              </span>
            )}
            {headline && (
              <h2 className='mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl'>
                {headline}
              </h2>
            )}
            {body && (
              <p className='mt-3 max-w-xl text-base text-white/90 sm:mt-4 sm:text-lg'>
                {body}
              </p>
            )}
            {cta?.link?.url && (
              <CmsButton
                cta={cta}
                className='mt-6'
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}
