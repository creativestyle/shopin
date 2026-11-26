import type { CommercetoolsOptions } from '../env'

/**
 * Once at boot: the scopes the API client was granted (a client-credentials token lists them), and an error that
 * names the missing ones and why a part needs them. `manage_project` grants every scope (an admin client).
 * `why` starts the message, e.g. "COMMERCETOOLS_LINK_CUSTOMERS=1 serves customers … through the project API".
 */
export async function checkGrantedScopes(
  options: CommercetoolsOptions,
  required: readonly string[],
  why: string,
  remedy: string
): Promise<void> {
  const response = await fetch(
    `${String(options.authUrl).replace(/\/$/, '')}/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${options.clientId}:${options.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  )
  if (!response.ok) {
    throw new Error(
      `${why}: the API client's scopes could not be read (token request answered ${response.status}); check COMMERCETOOLS_CLIENT_ID and COMMERCETOOLS_CLIENT_SECRET`
    )
  }
  const { scope = '' } = (await response.json().catch(() => ({}))) as {
    scope?: string
  }
  const granted = new Set(scope.split(' ').map((s) => s.split(':')[0]))
  const missing = granted.has('manage_project')
    ? []
    : required.filter((s) => !granted.has(s))
  if (missing.length) {
    throw new Error(
      `${why}, but the API client (COMMERCETOOLS_CLIENT_ID) lacks the scopes: ${missing.join(', ')}. ${remedy}`
    )
  }
}
