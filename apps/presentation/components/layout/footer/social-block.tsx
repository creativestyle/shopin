import type { FooterSocial } from '@core/contracts/content/layout'
import { getCmsLinkProps } from '@/features/content/cms-link'
import { getSocialShortcut } from './get-social-shortcut'

export function SocialBlock({ social }: { social: FooterSocial }) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {social.title}
      </h3>
      <div className='flex gap-3'>
        {social.links.map((link, i) => (
          <a
            key={i}
            {...getCmsLinkProps(link)}
            className='flex size-8 items-center justify-center rounded-lg bg-gray-300 text-xs font-bold text-white transition-colors hover:bg-gray-400'
            aria-label={link.ariaLabel ?? link.label}
          >
            {getSocialShortcut(link)}
          </a>
        ))}
      </div>
    </div>
  )
}
