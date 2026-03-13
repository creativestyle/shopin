import type { CmsLinkResponse } from '@core/contracts/content/cms-link'
import { CmsLink } from '@/features/content/cms-link'
import { StandardContainer } from '../../ui/standard-container'

export function LegalBar({
  legalLinks,
  copyright,
}: {
  legalLinks: CmsLinkResponse[]
  copyright?: string
}) {
  return (
    <div className='bg-gray-950 py-6 text-white'>
      <StandardContainer>
        <div className='flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0'>
          <div className='flex w-full flex-col items-start space-y-2.5 text-sm text-gray-300 md:w-auto md:flex-row md:items-center md:space-y-0 md:space-x-6'>
            {legalLinks.map((link, i) => (
              <CmsLink
                key={i}
                link={link}
                className='transition-colors hover:text-white'
              />
            ))}
          </div>
          {copyright && (
            <div className='w-full text-center text-sm font-bold text-white md:w-auto md:text-left'>
              {copyright}
            </div>
          )}
        </div>
      </StandardContainer>
    </div>
  )
}
