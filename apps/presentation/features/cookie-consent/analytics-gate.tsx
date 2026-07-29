'use client'

import Script from 'next/script'
import { useConsentGate } from './consent-gate'

/**
 * Renders the (mock) analytics tag only while the visitor has consented to the
 * `analytics` category. When consent is false the `<script>` is not rendered in
 * the DOM at all; if it changes back to false after the script has already
 * initialised, the tag is removed and stays gone on the next navigation.
 *
 * Swap the inline body for a real tracker (e.g. GTM) when a live tag is added.
 */
export function AnalyticsGate() {
  const allowed = useConsentGate('analytics')
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
        document.cookie = '_analytics_id=' + id + '; max-age=7776000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'analytics_consent_granted', id: id });
      `}
    </Script>
  )
}
