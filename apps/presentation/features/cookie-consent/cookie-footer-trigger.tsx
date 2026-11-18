'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useConsent } from './use-consent'

/**
 * Footer link that reopens the preferences dialog so visitors can review and
 * change their choice at any time. Styled to match the legal-bar links.
 */
export function CookieFooterTrigger({ className }: { className?: string }) {
  const t = useTranslations('cookieConsent')
  const { openPreferences } = useConsent()

  return (
    <button
      type='button'
      onClick={openPreferences}
      className={cn(
        'cursor-pointer text-left transition-colors hover:text-white',
        className
      )}
    >
      {t('footerLink')}
    </button>
  )
}
