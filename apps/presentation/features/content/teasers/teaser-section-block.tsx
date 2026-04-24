import { ContentImage } from '@/features/content/content-image'
import { CmsLink } from '@/features/content/cms-link'
import type { SectionTeaser } from '@core/contracts/content/teaser-section'

export function TeaserSectionBlock({
  teaser,
  imagePreload,
}: {
  teaser: SectionTeaser
  imagePreload?: boolean
}) {
  const { categoryLabel, headline, body, subcategoryLinks = [], image } = teaser
  const hasLeftContent =
    categoryLabel || headline || body || (subcategoryLinks?.length ?? 0) > 0
  if (!hasLeftContent && !image?.url) {
    return null
  }

  return (
    <section
      className='flex w-full flex-col bg-white'
      aria-label={headline ?? categoryLabel}
    >
      <div className='grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] md:gap-12 lg:gap-16'>
        {/* Left column: text content */}
        <div className='flex flex-col justify-center px-4 py-8 sm:px-6 md:py-12 lg:py-16'>
          {categoryLabel && (
            <span className='text-xs font-medium tracking-wider text-gray-700 uppercase'>
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
          {subcategoryLinks && subcategoryLinks.length > 0 && (
            <ul className="mt-6 flex list-[''] flex-col gap-1.5">
              {subcategoryLinks.map((link, i) => (
                <li key={i}>
                  <CmsLink link={link} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column: image */}
        <div className='relative aspect-[4/3] min-h-[200px] w-full min-w-0 overflow-hidden rounded-lg bg-gray-100 sm:min-h-[240px] md:aspect-[5/4] md:max-h-full'>
          {image && (
            <ContentImage
              image={image}
              fill
              className='object-cover'
              preload={imagePreload}
              sizes='(min-width: 768px) 55vw, 100vw'
            />
          )}
        </div>
      </div>
    </section>
  )
}
