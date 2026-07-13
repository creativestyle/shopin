/** Shared port/URL constants for the e2e harness.
 *  APP_PORT uses 3100 (not 3000) so the e2e server never conflicts with a
 *  co-running `next dev` or `next start` on the default dev port. */
export const APP_PORT = 3100
export const MOCK_BFF_PORT = 3001
export const FAKE_CMS_PORT = 3002

export const APP_BASE = `http://localhost:${APP_PORT}`
export const MOCK_BFF_BASE = `http://localhost:${MOCK_BFF_PORT}`
export const FAKE_CMS_BASE = `http://localhost:${FAKE_CMS_PORT}`

/** The draft secret used in .env.e2e and minted in test helpers. */
export const E2E_DRAFT_SECRET = 'e2e-test-secret-do-not-use-in-prod'
