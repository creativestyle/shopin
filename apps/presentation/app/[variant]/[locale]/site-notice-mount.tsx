'use client'

import { SiteNotice } from '@/lib/slots'
import { useIsLegalRoute } from '@/hooks/use-is-legal-route'
import { useConsent } from '@/features/cookie-consent/use-consent'

/** The shop's `SiteNotice` slot (the demo fills it with its demo notice), never on the legal pages. */
export function SiteNoticeMount() {
  const isLegalRoute = useIsLegalRoute()
  const { isReady, isBannerVisible } = useConsent()
  // wait for the cookie banner so two blocking modals never stack
  if (!SiteNotice || isLegalRoute || !isReady || isBannerVisible) {
    return null
  }
  return <SiteNotice />
}
