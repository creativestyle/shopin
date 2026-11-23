'use client'

import type { ReactNode } from 'react'
import type { ConsentCategory } from './cookie-consent-config'
import { useConsent } from './use-consent'

/**
 * Returns whether the visitor has consented to a given non-essential category.
 * Use this to gate loading of analytics/marketing scripts, e.g.
 *
 *   const analyticsAllowed = useConsentGate('analytics')
 *   {analyticsAllowed && <Script src="https://…/gtag.js" />}
 *
 * Withdrawing a category reloads the page, so a tag that already ran stops.
 */
export function useConsentGate(category: ConsentCategory): boolean {
  const { consentState } = useConsent()
  return consentState?.categories[category] === true
}

/** Renders its children only once the visitor has consented to `category`. */
export function ConsentGate({
  category,
  children,
}: {
  category: ConsentCategory
  children: ReactNode
}) {
  return useConsentGate(category) ? <>{children}</> : null
}
