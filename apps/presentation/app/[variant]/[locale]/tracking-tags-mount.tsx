'use client'

import { cloneElement } from 'react'
import { useClientSlots } from '@/features/slots/client-slots'
import { useConsentGate } from '@/features/cookie-consent/consent-gate'
import { useConsent } from '@/features/cookie-consent/use-consent'

/** The shop's `TrackingTags` slot (the demo fills it with sample tags), given the visitor's consent. */
export function TrackingTagsMount() {
  const { trackingTags } = useClientSlots()
  const { isReady } = useConsent()
  const analytics = useConsentGate('analytics')
  const marketing = useConsentGate('marketing')
  if (!trackingTags) {
    return null
  }
  return cloneElement(trackingTags, {
    ready: isReady,
    analytics,
    marketing,
  })
}
