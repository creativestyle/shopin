/**
 * Standalone entry point for the recording mock BFF.
 *
 * Run via Playwright's webServer config so the mock BFF is guaranteed to be
 * listening before the Next.js server starts serving requests (and therefore
 * before any translation fetches hit port 3001).
 *
 * The server keeps running until Playwright tears down the webServer process.
 */
import { getMockBffServer } from './server'
import { MOCK_BFF_PORT } from '../config'

const server = getMockBffServer()
// No hostname → Node binds dual-stack (::), so both 127.0.0.1 and ::1 work.
// Playwright's readiness probe resolves localhost to ::1; an explicit '0.0.0.0'
// would be IPv4-only and the probe would never succeed.
server.listen(MOCK_BFF_PORT, () => {
  console.log(`[mock-bff] Listening on port ${MOCK_BFF_PORT}`)
})
