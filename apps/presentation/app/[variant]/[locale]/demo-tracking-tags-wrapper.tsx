'use client'

import { MockTrackingTags } from '@demo/mock-tracking-tags'
import { useConsentGate } from '@/features/cookie-consent/consent-gate'

export function DemoTrackingTagsWrapper() {
  const analytics = useConsentGate('analytics')
  const marketing = useConsentGate('marketing')
  return (
    <MockTrackingTags
      analytics={analytics}
      marketing={marketing}
    />
  )
}
