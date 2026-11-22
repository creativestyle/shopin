'use client'

import { DemoDisclaimerModal } from '@demo/demo-disclaimer'
import { useIsLegalRoute } from '@/hooks/use-is-legal-route'
import { useConsent } from '@/features/cookie-consent/use-consent'

export function DemoDisclaimerModalWrapper() {
  const isLegalRoute = useIsLegalRoute()
  const { isReady, isBannerVisible } = useConsent()
  // Wait for the cookie banner so the two blocking modals never stack.
  if (isLegalRoute || !isReady || isBannerVisible) {
    return null
  }
  return <DemoDisclaimerModal />
}
