'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface MockTagProps {
  id: string
  cookie: string
  event: string
  allowed: boolean
}

// Fake tag: sets an identifier cookie and pushes a dataLayer event, nothing is sent anywhere.
function MockTag({ id, cookie, event, allowed }: MockTagProps) {
  useEffect(() => {
    if (!allowed) {
      document.cookie = `${cookie}=; max-age=0; path=/; SameSite=Lax`
    }
  }, [allowed, cookie])

  if (!allowed) {
    return null
  }

  return (
    <Script
      id={id}
      strategy='afterInteractive'
    >
      {`
        var id = '${id}-' + Date.now().toString(36);
        document.cookie = '${cookie}=' + id + '; max-age=7776000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: '${event}', id: id });
      `}
    </Script>
  )
}

export interface MockTrackingTagsProps {
  /** Visitor consented to the analytics category. */
  analytics: boolean
  /** Visitor consented to the marketing category. */
  marketing: boolean
}

/** Demo-only analytics and marketing tags, rendered only for consented categories. */
export function MockTrackingTags({
  analytics,
  marketing,
}: MockTrackingTagsProps) {
  return (
    <>
      <MockTag
        id='mock-analytics'
        cookie='_analytics_id'
        event='analytics_consent_granted'
        allowed={analytics}
      />
      <MockTag
        id='mock-marketing'
        cookie='_mkt_id'
        event='marketing_consent_granted'
        allowed={marketing}
      />
    </>
  )
}
