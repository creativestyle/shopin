'use client'

import { TrackingTags } from '@/lib/slots'
import { useConsentGate } from '@/features/cookie-consent/consent-gate'
import { useConsent } from '@/features/cookie-consent/use-consent'

/** The shop's `TrackingTags` slot (the demo fills it with sample tags), given the visitor's consent. */
export function TrackingTagsMount() {
  const { isReady } = useConsent()
  const analytics = useConsentGate('analytics')
  const marketing = useConsentGate('marketing')
  if (!TrackingTags) {
    return null
  }
  return (
    <TrackingTags
      ready={isReady}
      analytics={analytics}
      marketing={marketing}
    />
  )
}
