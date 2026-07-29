'use client'

import Script from 'next/script'
import { useConsentGate } from './consent-gate'

/**
 * Marketing counterpart to {@link AnalyticsGate} — renders the (mock) marketing
 * tag only while the `marketing` category is consented, and not at all otherwise.
 * Swap the inline body for a real pixel (e.g. Meta, Google Ads) when added.
 */
export function MarketingGate() {
  const allowed = useConsentGate('marketing')
  if (!allowed) {
    return null
  }

  return (
    <Script
      id='mock-marketing'
      strategy='afterInteractive'
    >
      {`
        var id = 'mkt-' + Date.now().toString(36);
        document.cookie = '_mkt_id=' + id + '; max-age=7776000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'marketing_consent_granted', id: id });
      `}
    </Script>
  )
}
