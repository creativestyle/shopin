'use client'

/**
 * Client-safe BFF utilities
 *
 * These utilities only access public environment variables
 * and are safe to import on the client side.
 */

/**
 * Get the client-side BFF URL
 * @returns The BFF URL - prefers internal URL if available (server-side), otherwise external URL (client-side)
 */
export function getBffClientUrl(): string {
  // First check if server internal URL exists (for SSR scenarios)
  const internalUrl = process.env.NEXT_BFF_INTERNAL_URL
  if (internalUrl) {
    return internalUrl
  }

  // If on client side, use the public external URL
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL || ''
  }

  // During SSR without internal URL, return empty string
  return ''
}
