'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useConsentGate } from './consent-gate'

const MARKETING_COOKIE = '_mkt_id'

/**
 * Marketing counterpart to {@link AnalyticsGate} — renders the (mock) marketing
 * tag only while the `marketing` category is consented, and removes its cookie
 * when consent is absent or withdrawn. Swap the inline body for a real pixel
 * (e.g. Meta, Google Ads) when added.
 */
export function MarketingGate() {
  const allowed = useConsentGate('marketing')

  useEffect(() => {
    if (!allowed) {
      document.cookie = `${MARKETING_COOKIE}=; max-age=0; path=/; SameSite=Lax`
    }
  }, [allowed])

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
        document.cookie = '${MARKETING_COOKIE}=' + id + '; max-age=7776000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'marketing_consent_granted', id: id });
      `}
    </Script>
  )
}
