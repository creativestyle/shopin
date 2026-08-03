'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useConsentGate } from './consent-gate'

const ANALYTICS_COOKIE = '_analytics_id'

/**
 * Renders the (mock) analytics tag only while the visitor has consented to the
 * `analytics` category. When consent is absent or withdrawn the `<script>` is
 * not rendered in the DOM and the cookie it may have set is removed, so
 * declining stops future tracking *and* clears the existing cookie.
 *
 * Swap the inline body for a real tracker (e.g. GTM) when a live tag is added.
 */
export function AnalyticsGate() {
  const allowed = useConsentGate('analytics')

  useEffect(() => {
    if (!allowed) {
      document.cookie = `${ANALYTICS_COOKIE}=; max-age=0; path=/; SameSite=Lax`
    }
  }, [allowed])

  if (!allowed) {
    return null
  }

  return (
    <Script
      id='mock-analytics'
      strategy='afterInteractive'
    >
      {`
        var id = 'anlt-' + Date.now().toString(36);
        document.cookie = '${ANALYTICS_COOKIE}=' + id + '; max-age=7776000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'analytics_consent_granted', id: id });
      `}
    </Script>
  )
}
