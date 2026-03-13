import { ContentImage } from '@/features/content/content-image'
import { CmsLink } from '@/features/content/cms-link'
import { Card } from '@/components/ui/card'
import type { ImageTeaser } from '@core/contracts/content/teaser-image'

export function TeaserImageBlock({
  teaser,
  imagePreload,
}: {
  teaser: ImageTeaser
  imagePreload?: boolean
}) {
  const { title, image, caption, link } = teaser
  const href = link?.url
  const content = (
    <>
      {image && (
        <div className='relative aspect-[3/4] w-full overflow-hidden rounded-t-lg sm:aspect-[4/3]'>
          <ContentImage
            image={image}
            fill
            className='object-cover'
            preload={imagePreload}
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
          />
        </div>
      )}
      <div className='p-4'>
        {title && (
          <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
        )}
        {caption && <p className='mt-1 text-sm text-gray-600'>{caption}</p>}
        {href && !title && (
          <span className='mt-2 inline-block text-sm font-medium text-primary underline'>
            {link.label}
          </span>
        )}
      </div>
    </>
  )

  return (
    <Card
      scheme='gray'
      className='overflow-hidden p-0'
    >
      {href ? (
        <CmsLink
          link={link}
          className='block'
        >
          {content}
        </CmsLink>
      ) : (
        content
      )}
    </Card>
  )
}
