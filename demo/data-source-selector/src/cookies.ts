/** Writes one category's provider choice; the storefront proxy reads it on the next request. */
export function writeProviderCookie(cookie: string, provider: string): void {
  if (typeof document === 'undefined') {
    return
  }
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${cookie}=${encodeURIComponent(provider)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}
