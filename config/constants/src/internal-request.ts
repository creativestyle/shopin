/**
 * Headers for server-to-server calls from the presentation server to the BFF.
 * The BFF trusts the client IP header only when the secret header matches BFF_INTERNAL_SECRET.
 */
export const INTERNAL_SECRET_HEADER = 'x-bff-internal-secret'
export const CLIENT_IP_HEADER = 'x-bff-client-ip'
