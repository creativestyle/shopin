import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import {
  I18N_CONFIG,
  listLocales,
  getLocale,
  CORRELATION_ID_HEADER,
} from '@config/constants'
import { routing } from '@/i18n/routing'
import {
  generateCorrelationId,
  isValidCorrelationId,
} from '@core/logger-config'
import {
  hasVariantPrefix,
  DEFAULT_VARIANT_SEGMENT,
  resolveVariant,
  encodeVariant,
} from '@/lib/variant/variant-key'
import {
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
  DRAFT_COOKIE_MAX_AGE_SEC,
} from '@/lib/draft-mode'

const intlMiddleware = createMiddleware(routing)

const knownLocalePrefixes = new Set(listLocales().map((l) => l.urlPrefix))
const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

// ─── Small helpers ────────────────────────────────────────────────────────────

/** Returns the protocol ('http:' or 'https:') of FRONTEND_URL, defaulting to 'http:'. */
function getSiteProtocol(): string {
  try {
    return new URL(process.env.FRONTEND_URL ?? '').protocol
  } catch {
    return 'http:'
  }
}

/**
 * Returns true when the draft token's exp claim is in the future and within
 * the maximum allowed window (DRAFT_COOKIE_MAX_AGE_SEC + 60s clock-drift slack).
 * Token format: "${exp}.${sig}" where exp is a Unix timestamp (seconds).
 * Does NOT verify the HMAC signature — that stays in the preview page to keep
 * Node.js crypto out of the edge bundle. Expired or forged far-future tokens
 * are treated as absent.
 */
function isDraftTokenActiveByExp(token: string): boolean {
  const dotIdx = token.indexOf('.')
  if (dotIdx < 0) {
    return false
  }
  const exp = parseInt(token.slice(0, dotIdx), 10)
  if (!Number.isFinite(exp)) {
    return false
  }
  const nowSec = Math.floor(Date.now() / 1000)
  // Reject tokens whose exp is beyond what we ever issue — a legitimately minted
  // token cannot expire more than DRAFT_COOKIE_MAX_AGE_SEC seconds from now.
  // The +60 slack absorbs clock skew between the issuing server and this edge node.
  if (exp > nowSec + DRAFT_COOKIE_MAX_AGE_SEC + 60) {
    return false
  }
  return nowSec < exp
}

function resolveCorrelationId(request: NextRequest): string {
  const existing = request.headers.get(CORRELATION_ID_HEADER)
  return existing && isValidCorrelationId(existing)
    ? existing
    : generateCorrelationId()
}

// ─── Request context ──────────────────────────────────────────────────────────

interface RequestContext {
  segments: string[]
  firstSegment: string
  firstIsLocale: boolean
  locale: string
  draftCookieToken: string | undefined
  isPathPreview: boolean
  isPreview: boolean
  variantKey: string
  correlationId: string
}

/**
 * Build per-request context from the incoming request and intlMiddleware's response.
 *
 * Per next-intl docs, the resolved locale is read from the x-middleware-rewrite
 * header rather than being computed independently, so our locale resolution stays
 * in sync with next-intl's own logic across version upgrades.
 */
function buildRequestContext(
  request: NextRequest,
  intlResponse: NextResponse
): RequestContext {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean)
  const firstSegment = segments[0] ?? ''

  // Read locale from intlMiddleware's rewrite URL; fall back to request URL when
  // intlMiddleware issued a redirect (no x-middleware-rewrite) or plain next().
  const rewrittenUrl = intlResponse.headers.get('x-middleware-rewrite')
  const [, intlLocale] = new URL(rewrittenUrl || request.url).pathname.split(
    '/'
  )
  const locale = knownLocalePrefixes.has(intlLocale)
    ? intlLocale
    : defaultLocalePrefix

  const firstIsLocale = !!firstSegment && knownLocalePrefixes.has(firstSegment)
  const draftCookieToken = request.cookies.get(PREVIEW_TOKEN_COOKIE)?.value
  const isDraftActive =
    !!draftCookieToken && isDraftTokenActiveByExp(draftCookieToken)
  const isPathPreview =
    firstSegment === 'preview' || (firstIsLocale && segments[1] === 'preview')
  // Under an active draft cookie, every clean URL is funneled into the /preview subtree.
  // Functional routes with no draft (CMS) representation (cart, account, …) resolve to no
  // content there and render the 404 page — acceptable inside an editorial preview session.
  const isPreview = isPathPreview || isDraftActive

  // Preview always uses the default variant — no A/B testing in editorial preview sessions.
  const variantKey = isPreview
    ? DEFAULT_VARIANT_SEGMENT
    : encodeVariant(resolveVariant((n) => request.cookies.get(n)?.value))

  return {
    segments,
    firstSegment,
    firstIsLocale,
    locale,
    draftCookieToken,
    isPathPreview,
    isPreview,
    variantKey,
    correlationId: resolveCorrelationId(request),
  }
}

// ─── Rewrite helper ───────────────────────────────────────────────────────────

/**
 * Create a rewrite response following the next-intl middleware composition pattern.
 *   - `headers: intlResponse.headers` preserves NEXT_LOCALE cookies and any other
 *     response headers intlMiddleware may add in future versions.
 *   - `request.headers` carries x-next-intl-locale (required by getLocale() in server
 *     components) and the correlation ID.
 *
 * Why x-next-intl-locale must be set explicitly:
 * intlMiddleware sets X-NEXT-INTL-LOCALE via `request: { headers }` on its own
 * NextResponse.rewrite() call. Our rewrite (which adds the variant prefix) replaces
 * that rewrite entirely — server components only see the headers from *our* response.
 * { headers: intlResponse.headers } only carries response headers to the browser,
 * not request headers to server components, so we must forward the locale ourselves.
 *
 * @see https://next-intl.dev/docs/routing/middleware#composing-other-middlewares
 */
function rewrite(
  request: NextRequest,
  pathname: string,
  ctx: RequestContext,
  intlResponse: NextResponse
): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = pathname

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(CORRELATION_ID_HEADER, ctx.correlationId)
  requestHeaders.set('x-next-intl-locale', ctx.locale)

  return NextResponse.rewrite(url, {
    headers: intlResponse.headers,
    request: { headers: requestHeaders },
  })
}

// ─── Route handlers ───────────────────────────────────────────────────────────

/** Preview paths — either explicit /preview/… URL or cookie-driven in-app navigation. */
function handlePreviewPath(
  request: NextRequest,
  ctx: RequestContext,
  intlResponse: NextResponse
): NextResponse {
  const {
    segments,
    firstSegment,
    firstIsLocale,
    locale,
    draftCookieToken,
    isPathPreview,
    variantKey,
  } = ctx

  let internalPathname: string
  if (isPathPreview) {
    internalPathname = firstIsLocale
      ? `/${variantKey}/${segments.join('/')}`
      : `/${variantKey}/${locale}/${segments.join('/')}`
  } else {
    // Cookie-driven navigation on a clean /locale/... path: inject /preview/ after the locale.
    internalPathname = firstIsLocale
      ? `/${variantKey}/${firstSegment}/preview/${segments.slice(1).join('/')}`
      : `/${variantKey}/${locale}/preview/${segments.join('/')}`
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = internalPathname

  // Prefer the session cookie when it is still valid; fall back to the __pt URL
  // param so that a fresh CMS preview link works even when the browser holds a
  // stale (expired) cookie. Without this check an expired cookie silently wins
  // over a fresh URL token and every preview link 404s until cookies are cleared.
  //
  // Both sources are exp-validated before they can establish a session. The URL
  // token must be checked too: an unvalidated bad/expired ?__pt= would otherwise
  // set the session cookie below, which the preview page reads back and treats as
  // a recovery-worthy session — silently serving the live page instead of the 404
  // an invalid preview link must produce.
  const urlParamRaw =
    request.nextUrl.searchParams.get(PREVIEW_TOKEN_INTERNAL_PARAM) ?? undefined
  const urlParamToken =
    urlParamRaw && isDraftTokenActiveByExp(urlParamRaw)
      ? urlParamRaw
      : undefined
  const activeCookieToken =
    draftCookieToken && isDraftTokenActiveByExp(draftCookieToken)
      ? draftCookieToken
      : undefined
  const activeToken = activeCookieToken ?? urlParamToken

  if (
    activeToken &&
    !rewriteUrl.searchParams.has(PREVIEW_TOKEN_INTERNAL_PARAM)
  ) {
    rewriteUrl.searchParams.set(PREVIEW_TOKEN_INTERNAL_PARAM, activeToken)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(CORRELATION_ID_HEADER, ctx.correlationId)
  requestHeaders.set('x-next-intl-locale', ctx.locale)

  const response = NextResponse.rewrite(rewriteUrl, {
    headers: intlResponse.headers,
    request: { headers: requestHeaders },
  })

  // Establish / refresh the draft session cookie so subsequent in-app navigations
  // continue to be routed through the preview subtree.
  if (activeToken) {
    const isSiteSsl = getSiteProtocol() === 'https:'
    response.cookies.set({
      name: PREVIEW_TOKEN_COOKIE,
      value: activeToken,
      httpOnly: true,
      path: '/',
      maxAge: DRAFT_COOKIE_MAX_AGE_SEC,
      secure: isSiteSsl,
      sameSite: isSiteSsl ? 'none' : 'lax',
    })
  }

  return response
}

/** Standard routing: inject variant prefix, delegate locale to intlMiddleware's output. */
function handleStandardPath(
  request: NextRequest,
  ctx: RequestContext,
  intlResponse: NextResponse
): NextResponse {
  const { segments, firstIsLocale, locale, variantKey } = ctx

  let internalPathname: string
  if (firstIsLocale) {
    // Explicit locale: /de/foo → /${variantKey}/de/foo
    internalPathname = `/${variantKey}/${segments.join('/')}`
  } else if (segments.length > 0) {
    // Unprefixed path: /foo → /${variantKey}/${locale}/foo
    internalPathname = `/${variantKey}/${locale}/${segments.join('/')}`
  } else {
    // Root: / → /${variantKey}/${locale}
    internalPathname = `/${variantKey}/${locale}`
  }

  return rewrite(request, internalPathname, ctx, intlResponse)
}

// ─── Middleware entry point ───────────────────────────────────────────────────

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // [variant]-segment guard: the ~ prefix is an internal implementation detail and
  // must never appear in public URLs. Any ~-prefixed first segment is 308-redirected
  // to the clean path. Next.js middleware never re-runs on its own rewrite targets,
  // so our internal ~-prefixed rewrites do NOT trigger this guard.
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? ''
  if (hasVariantPrefix(firstSegment)) {
    const stripped = pathname.slice(1 + firstSegment.length) || '/'
    const url = request.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.redirect(url, 308)
  }

  // Run intlMiddleware first per next-intl docs recommendation for middleware
  // composition. Its response carries x-next-intl-locale, NEXT_LOCALE cookies,
  // and the resolved locale via x-middleware-rewrite — all preserved in our rewrites.
  const intlResponse = intlMiddleware(request)
  const ctx = buildRequestContext(request, intlResponse)

  // For non-preview paths, pass intlMiddleware's locale-detection redirects through.
  // Preview skips this — locale-detection redirects would break the preview flow.
  if (!ctx.isPreview && intlResponse.headers.get('location')) {
    return intlResponse
  }

  if (ctx.isPreview) {
    return handlePreviewPath(request, ctx, intlResponse)
  }
  return handleStandardPath(request, ctx, intlResponse)
}

export const config = {
  // Match internationalized pathnames and variant-key URLs (redirected to clean path).
  // Excludes static assets and API routes.
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}
