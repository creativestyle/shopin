'use client'

import { MockTrackingTags } from '@demo/mock-tracking-tags'
import { useConsentGate } from '@/features/cookie-consent/consent-gate'
import { useConsent } from '@/features/cookie-consent/use-consent'

export function DemoTrackingTagsWrapper() {
  const { isReady } = useConsent()
  const analytics = useConsentGate('analytics')
  const marketing = useConsentGate('marketing')
  return (
    <MockTrackingTags
      ready={isReady}
      analytics={analytics}
      marketing={marketing}
    />
  )
}
