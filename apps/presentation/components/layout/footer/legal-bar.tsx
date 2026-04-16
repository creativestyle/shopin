import type { CmsLinkResponse } from '@core/contracts/content/cms-link'
import { CmsLink } from '@/features/content/cms-link'
import { StandardContainer } from '../../ui/standard-container'

export interface LegalBarProps {
  legalLinks: CmsLinkResponse[]
  copyright?: string | null
}

/** Bottom legal strip from GET content/footer only (`legalLinks` + `copyright`). */
export function LegalBar({ legalLinks, copyright }: LegalBarProps) {
  const text = copyright?.trim()
  if (legalLinks.length === 0 && !text) {
    return null
  }

  return (
    <div className='bg-gray-950 py-6 text-white'>
      <StandardContainer>
        <div className='flex flex-col-reverse items-start justify-between gap-4 md:flex-row md:items-center md:gap-0'>
          <div className='flex w-full flex-col items-start space-y-2.5 text-sm text-gray-300 md:w-auto md:flex-row md:items-center md:space-y-0 md:space-x-6'>
            {legalLinks.map((link, i) => (
              <CmsLink
                key={i}
                link={link}
                className='transition-colors hover:text-white'
              />
            ))}
          </div>
          {text && <div className='text-sm font-bold text-white'>{text}</div>}
        </div>
      </StandardContainer>
    </div>
  )
}
