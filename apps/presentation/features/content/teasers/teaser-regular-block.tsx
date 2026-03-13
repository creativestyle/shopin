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
  const hasRightContent = categoryLabel || headline || body || cta?.link?.url
  if (!hasRightContent && !image?.url) {
    return null
  }

  return (
    <section
      className='relative flex min-h-[320px] w-full overflow-hidden sm:min-h-[400px] md:min-h-[480px]'
      aria-label={headline ?? categoryLabel}
    >
      {image && (
        <div className='absolute inset-0'>
          <ContentImage
            image={image}
            fill
            className='object-cover'
            sizes='(min-width: 1920px) 1920px, 100vw'
            preload={imagePreload}
          />
        </div>
      )}

      {/* Text panel with background */}
      {hasRightContent && (
        <div className='relative flex min-h-0 flex-col justify-center p-6 sm:p-8 md:max-w-md md:p-10 lg:max-w-lg lg:p-12'>
          <div className='rounded-lg bg-white/95 px-5 py-6 shadow-sm backdrop-blur-sm sm:px-6 sm:py-8 md:px-8 md:py-10'>
            {categoryLabel && (
              <span className='text-xs font-medium tracking-wider text-gray-500 uppercase'>
                {categoryLabel}
              </span>
            )}
            {headline && (
              <h2 className='mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl'>
                {headline}
              </h2>
            )}
            {body && (
              <p className='mt-3 max-w-xl text-base text-gray-600 sm:mt-4 sm:text-lg'>
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
