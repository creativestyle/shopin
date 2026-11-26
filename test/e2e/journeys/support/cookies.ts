/**
 * Cookies every journey context starts with: the consent banner and the demo
 * notice are answered, and the storefront uses the run's data source.
 */

type StorageState = {
  cookies: {
    name: string
    value: string
    domain: string
    path: string
    expires: number
    httpOnly: boolean
    secure: boolean
    sameSite: 'Lax'
  }[]
  origins: []
}

function consentCookieValue() {
  return encodeURIComponent(
    JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      categories: { analytics: false, marketing: false },
    })
  )
}

export function journeyStorageState(
  storefrontUrl: string,
  dataSource?: string
): StorageState {
  const domain = new URL(storefrontUrl).hostname
  const cookie = (name: string, value: string) => ({
    name,
    value,
    domain,
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
  })

  return {
    cookies: [
      cookie('cookie_consent', consentCookieValue()),
      cookie('demo-disclaimer-acknowledged', 'true'),
      ...(dataSource ? [cookie('data-source', dataSource)] : []),
    ],
    origins: [],
  }
}
