import { ContentImage } from '@/features/content/content-image'
import { CmsButton } from '@/features/content/cms-button'
import { cn } from '@/lib/utils'
import type { HeroTeaser } from '@core/contracts/content/teaser-hero'

export function TeaserHeroBlock({
  teaser,
  imagePreload,
}: {
  teaser: HeroTeaser
  imagePreload?: boolean
}) {
  const { backgroundImage, headline, body, cta } = teaser
  const hasContent = headline || body || cta?.link?.url
  const hasBg = Boolean(backgroundImage?.url)
  if (!hasContent && !backgroundImage?.url) {
    return null
  }

  return (
    <section
      className={cn('relative w-full overflow-hidden', {
        'min-h-[280px] sm:min-h-[320px] md:aspect-[1920/523] md:min-h-0': hasBg,
      })}
      aria-label={headline}
    >
      {backgroundImage && (
        <div className='absolute inset-0'>
          <ContentImage
            image={backgroundImage}
            fill
            className='object-cover'
            preload={imagePreload}
            sizes='(min-width: 1920px) 1920px, 100vw'
          />
          <div
            className='absolute inset-0 bg-black/40'
            aria-hidden
          />
        </div>
      )}
      <div
        className={cn('flex flex-col items-center justify-center text-center', {
          'absolute inset-0 px-4 py-6 text-white sm:px-6 sm:py-8': hasBg,
          'relative min-h-[200px] px-4 py-12 sm:px-6': !hasBg,
        })}
      >
        {headline && (
          <h2 className='text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl'>
            {headline}
          </h2>
        )}
        {body && (
          <p
            className={cn({
              'mt-2 max-w-xl text-base opacity-95 sm:mt-3 sm:text-lg': hasBg,
              'mt-3 max-w-2xl text-lg text-gray-700': !hasBg,
            })}
          >
            {body}
          </p>
        )}
        {cta?.link?.url && (
          <CmsButton
            cta={cta}
            className={cn({ 'mt-4 sm:mt-5': hasBg, 'mt-5': !hasBg })}
          />
        )}
      </div>
    </section>
  )
}
