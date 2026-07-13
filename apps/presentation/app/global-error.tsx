'use client'

import { RootFallbackShell } from './root-fallback-shell'

/**
 * Top-level error boundary required by Next.js App Router.
 * Must render its own <html> and <body> because it replaces the root layout.
 * The [variant]/[locale]/layout.tsx renders <html lang={locale}> for all normal
 * routes; this component handles errors thrown above or outside that layout.
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RootFallbackShell>
      <h1>Something went wrong</h1>
      <button onClick={reset}>Try again</button>
    </RootFallbackShell>
  )
}
