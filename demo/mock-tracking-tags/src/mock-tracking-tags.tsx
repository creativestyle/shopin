'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface MockTagProps {
  id: string
  cookie: string
  event: string
  ready: boolean
  allowed: boolean
}

// Fake tag: sets an identifier cookie and pushes a dataLayer event, nothing is sent anywhere.
function MockTag({ id, cookie, event, ready, allowed }: MockTagProps) {
  // Only once consent is known, so a consented visitor's cookie survives hydration.
  useEffect(() => {
    if (ready && !allowed) {
      document.cookie = `${cookie}=; max-age=0; path=/; SameSite=Lax`
    }
  }, [ready, allowed, cookie])

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

interface MockTrackingTagsProps {
  /** Stored consent has been read on the client. */
  ready: boolean
  /** Visitor consented to the analytics category. */
  analytics: boolean
  /** Visitor consented to the marketing category. */
  marketing: boolean
}

/** Demo-only analytics and marketing tags, rendered only for consented categories. */
export function MockTrackingTags({
  ready,
  analytics,
  marketing,
}: MockTrackingTagsProps) {
  return (
    <>
      <MockTag
        id='mock-analytics'
        cookie='_analytics_id'
        event='analytics_consent_granted'
        ready={ready}
        allowed={analytics}
      />
      <MockTag
        id='mock-marketing'
        cookie='_mkt_id'
        event='marketing_consent_granted'
        ready={ready}
        allowed={marketing}
      />
    </>
  )
}
