const COOKIE_NAME = 'demo-disclaimer-acknowledged'
const COOKIE_REGEX = new RegExp(`(?:^|; )${COOKIE_NAME}=true`)
const EXPIRY_DAYS = 30
const SESSION_KEY = 'demo-disclaimer-dismissed'

function buildAcknowledgementCookie(): string {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS)
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:'
  return `${COOKIE_NAME}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function hasAcknowledgedDemoDisclaimer(): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  return COOKIE_REGEX.test(document.cookie)
}

export function acknowledgeDemoDisclaimer(): void {
  if (typeof document === 'undefined') {
    return
  }
  document.cookie = buildAcknowledgementCookie()
}

export function hasDismissedDemoDisclaimerThisSession(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

export function dismissDemoDisclaimerForSession(): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.sessionStorage.setItem(SESSION_KEY, 'true')
  } catch {}
}
