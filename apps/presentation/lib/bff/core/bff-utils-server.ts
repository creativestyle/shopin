'use server'

/**
 * Server-only BFF utilities
 *
 * These utilities access server-side environment variables
 * and should NEVER be imported on the client side.
 */

/**
 * Get the server-side BFF URL
 * @returns The internal BFF URL from environment variables
 * @throws Error if NEXT_BFF_INTERNAL_URL is not set
 */
export async function getBffServerUrl(): Promise<string> {
  const url = process.env.NEXT_BFF_INTERNAL_URL

  if (!url) {
    throw new Error('NEXT_BFF_INTERNAL_URL environment variable is not set')
  }

  return url
}
