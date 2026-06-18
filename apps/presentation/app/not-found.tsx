import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
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
 *
 * getRequestConfig falls back to the default locale when no locale segment is
 * present in the URL, so getTranslations resolves correctly here.
 */
export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <RootFallbackShell>
      <h1>{t('title')}</h1>
      <Link href='/'>{t('backHome')}</Link>
    </RootFallbackShell>
  )
}
