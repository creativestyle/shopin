import { Card } from '@/components/ui/card'
import { CmsButton } from '@/features/content/cms-button'
import type { HeadlineTeaser } from '@core/contracts/content/teaser-headline'

export function TeaserHeadlineBlock({ teaser }: { teaser: HeadlineTeaser }) {
  const { headline, subtext, cta } = teaser
  if (!headline) {
    return null
  }

  return (
    <Card
      scheme='white'
      className='p-6 text-center'
    >
      <h2 className='text-2xl font-bold text-gray-900 md:text-3xl'>
        {headline}
      </h2>
      {subtext && <p className='mt-2 text-gray-600'>{subtext}</p>}
      {cta?.link?.url && (
        <CmsButton
          cta={cta}
          className='mt-4'
        />
      )}
    </Card>
  )
}
