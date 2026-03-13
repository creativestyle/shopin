/**
 * Shared draft-mode token sign/verify for Next.js presentation and BFF.
 *
 * Token format: exp.signature
 * - exp: Unix timestamp (seconds) when the token expires
 * - signature: HMAC-SHA256(exp, secret), base64url
 *
 * Use the same secret (e.g. NEXT_DRAFT_MODE_SECRET) in both apps so the BFF
 * can verify tokens produced by the presentation app.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

/** Compute signature for payload (e.g. exp string). */
export function signDraftPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/**
 * Verify a token value "exp.signature" with the given secret.
 * Returns true only if the signature is valid and exp is in the future.
 */
export function verifyDraftToken(value: string, secret: string): boolean {
  const dot = value.indexOf('.')
  if (dot <= 0) {
    return false
  }
  const exp = value.slice(0, dot)
  const signature = value.slice(dot + 1)
  const expNum = parseInt(exp, 10)
  if (Number.isNaN(expNum) || expNum <= Math.floor(Date.now() / 1000)) {
    return false
  }
  const expected = signDraftPayload(exp, secret)
  if (expected.length !== signature.length) {
    return false
  }
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch {
    return false
  }
}

/**
 * Create a new token that expires in maxAgeSec seconds.
 * Returns "exp.signature" or "" if secret is empty.
 */
export function createDraftToken(secret: string, maxAgeSec: number): string {
  if (!secret) {
    return ''
  }
  const exp = String(Math.floor(Date.now() / 1000) + maxAgeSec)
  return `${exp}.${signDraftPayload(exp, secret)}`
}

/**
 * Timing-safe comparison of two secrets (e.g. for /api/draft body secret).
 * Use this so the raw NEXT_DRAFT_MODE_SECRET is never leaked via timing.
 */
export function timingSafeEqualSecrets(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) {
    return false
  }
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}
