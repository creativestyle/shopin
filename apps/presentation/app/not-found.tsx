import Link from 'next/link'
import { RootFallbackShell } from './root-fallback-shell'

/**
 * Root-level not-found boundary.
 *
 * The [variant]/[locale]/layout.tsx owns <html>/<body> for all real user-facing
 * routes — the middleware rewrites every browser request into that tree.
 * This component is a safety net for the rare cases where notFound() fires
 * above that layout (e.g. a misconfigured deployment or a build-time route
 * miss). It must render its own <html>/<body> because the root layout.tsx is
 * intentionally a bare fragment (<>{children}</>).
 */
export default function NotFound() {
  return (
    <RootFallbackShell>
      <h1>404 – Page not found</h1>
      <Link href='/'>Back to home</Link>
    </RootFallbackShell>
  )
}
