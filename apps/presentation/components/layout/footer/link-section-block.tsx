import type { FooterSectionResponse } from '@core/contracts/content/layout'
import { CmsLink } from '@/features/content/cms-link'

export function LinkSectionBlock({
  section,
}: {
  section: FooterSectionResponse
}) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {section.title}
      </h3>
      <div className='flex flex-col gap-2.5 text-sm leading-normal font-normal text-gray-600'>
        {section.links.map((link, j) => (
          <CmsLink
            key={j}
            link={link}
            className='transition-colors hover:text-gray-900'
          />
        ))}
      </div>
    </div>
  )
}
