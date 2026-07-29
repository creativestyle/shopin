'use client'

import { useTranslations } from 'next-intl'
import { useConsent } from './use-consent'

/**
 * Footer link that reopens the preferences dialog so visitors can review and
 * change their choice at any time. Styled to match the legal-bar links.
 */
export function CookieFooterTrigger() {
  const t = useTranslations('cookieConsent')
  const { openPreferences } = useConsent()

  return (
    <button
      type='button'
      onClick={openPreferences}
      className='cursor-pointer text-left transition-colors hover:text-white'
    >
      {t('footerLink')}
    </button>
  )
}
