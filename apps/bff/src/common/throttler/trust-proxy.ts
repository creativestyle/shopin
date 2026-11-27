/**
 * Express `trust proxy` from `BFF_TRUST_PROXY` (off when unset or "false"). Behind a load balancer or a CDN every
 * request arrives from the proxy's address, so the rate limiter would count all shoppers as one client; with the
 * setting, Express reads the client address from `X-Forwarded-For` (`req.ip`).
 * - a number: how many proxies stand in front of the BFF (`1` for one load balancer);
 * - addresses or subnets, comma-separated (`loopback, 10.0.0.0/8`): the proxies to trust.
 * Never trust a header no proxy of yours sets: a client could then choose its own address.
 */
export function trustProxy(
  env: Record<string, string | undefined> = process.env
): number | string | undefined {
  const value = env.BFF_TRUST_PROXY?.trim()
  if (!value || value === 'false') {
    return undefined
  }
  return /^\d+$/.test(value) ? Number(value) : value
}
