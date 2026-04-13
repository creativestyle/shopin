const COOKIE_NAME = 'demo-disclaimer-acknowledged'
const EXPIRY_DAYS = 30

export function hasAcknowledgedDemoDisclaimer(): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  return new RegExp(`(?:^|; )${COOKIE_NAME}=true`).test(document.cookie)
}

export function acknowledgeDemoDisclaimer(): void {
  if (typeof document === 'undefined') {
    return
  }
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS)
  document.cookie = `${COOKIE_NAME}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
}
