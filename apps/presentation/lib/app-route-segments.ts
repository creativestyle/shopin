/** Top-level app routes with no CMS draft representation; they render live during a draft session. */
export const APP_ROUTE_SEGMENTS: ReadonlySet<string> = new Set([
  'account',
  'cart',
  'checkout',
  'demo',
  'forgot-password',
  'reset-password',
  'search',
  'setup',
  'sign-in',
  'sign-up',
  'wishlist',
])

export function isAppRouteSegment(segment: string | undefined): boolean {
  return !!segment && APP_ROUTE_SEGMENTS.has(segment)
}
