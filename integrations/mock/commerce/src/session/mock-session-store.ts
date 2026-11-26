import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import type { AddressResponse } from '@core/contracts/customer/address'
import type { CustomerResponse } from '@core/contracts/customer/customer'

/** Seconds a mock access token lives, matching the commercetools default. */
const ACCESS_TOKEN_TTL_SECONDS = 172800

const ACCESS_TOKEN_TTL_MS = ACCESS_TOKEN_TTL_SECONDS * 1000
// Shorter than commercetools' 200 days: the mock keeps everything in BFF memory
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const ONE_TIME_TOKEN_TTL_MS = 60 * 60 * 1000
const SWEEP_INTERVAL_MS = 60 * 1000
// Any caller can pick the mock, so no store may grow without limit
const MAX_ENTRIES_PER_STORE = 10_000

export type MockAddress = Omit<
  AddressResponse,
  'isDefaultShipping' | 'isDefaultBilling'
> & { id: string }

export interface MockCustomer extends Omit<
  CustomerResponse,
  'isEmailVerified'
> {
  passwordHash: string
  isEmailVerified: boolean
  addresses: MockAddress[]
  defaultShippingAddressId?: string
  defaultBillingAddressId?: string
}

interface MockSession {
  id: string
  customerId?: string
}

interface ExpiringEntry<T> {
  value: T
  expiresAt: number
}

// In-memory stores shared by the mock auth, customer, cart and order services
const customers = new Map<string, MockCustomer>()
const sessions = new Map<string, MockSession>()
const accessTokens = new Map<string, ExpiringEntry<string>>()
const refreshTokens = new Map<string, ExpiringEntry<string>>()
const emailTokens = new Map<string, ExpiringEntry<string>>()
const passwordTokens = new Map<string, ExpiringEntry<string>>()

let lastSweep = 0

const newToken = () => randomBytes(24).toString('base64url')

/** Salted scrypt hash, stored as `salt:hash`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`
}

export function verifyPassword(stored: string, password: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) {
    return false
  }
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(expected, actual)
}

/** Owner of carts and orders: the customer once known, the guest session before. */
export const customerOwner = (customerId: string) => `customer:${customerId}`
export const guestOwner = (sessionId: string) => `session:${sessionId}`

/** Sets an entry, evicting the oldest one when the store is full. */
function setCapped<V>(store: Map<string, V>, key: string, value: V) {
  if (!store.has(key) && store.size >= MAX_ENTRIES_PER_STORE) {
    const oldest = store.keys().next().value
    if (oldest !== undefined) {
      store.delete(oldest)
    }
  }
  store.set(key, value)
}

function readLive<T>(store: Map<string, ExpiringEntry<T>>, key: string) {
  const entry = store.get(key)
  if (entry && entry.expiresAt < Date.now()) {
    store.delete(key)
    return undefined
  }
  return entry?.value
}

/** Drops expired tokens, and sessions no live token points to any more. */
function sweepExpired() {
  const now = Date.now()
  if (now - lastSweep < SWEEP_INTERVAL_MS) {
    return
  }
  lastSweep = now
  const live = new Set<string>()
  for (const store of [accessTokens, refreshTokens]) {
    for (const [token, entry] of store) {
      if (entry.expiresAt < now) {
        store.delete(token)
      } else {
        live.add(entry.value)
      }
    }
  }
  for (const store of [emailTokens, passwordTokens]) {
    for (const [token, entry] of store) {
      if (entry.expiresAt < now) {
        store.delete(token)
      }
    }
  }
  for (const id of sessions.keys()) {
    if (!live.has(id)) {
      sessions.delete(id)
    }
  }
}

function issueTokens(sessionId: string) {
  const accessToken = newToken()
  const refreshToken = newToken()
  const now = Date.now()
  setCapped(accessTokens, accessToken, {
    value: sessionId,
    expiresAt: now + ACCESS_TOKEN_TTL_MS,
  })
  setCapped(refreshTokens, refreshToken, {
    value: sessionId,
    expiresAt: now + REFRESH_TOKEN_TTL_MS,
  })
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  }
}

/** A new session (a guest one without a customer id) with its first tokens. */
export function openSession(customerId?: string) {
  sweepExpired()
  const session: MockSession = { id: randomUUID(), customerId }
  setCapped(sessions, session.id, session)
  return { sessionId: session.id, tokens: issueTokens(session.id) }
}

/** Ends a session: every token issued for it stops working. */
export function endSession(sessionId: string) {
  for (const store of [accessTokens, refreshTokens]) {
    for (const [token, entry] of store) {
      if (entry.value === sessionId) {
        store.delete(token)
      }
    }
  }
  sessions.delete(sessionId)
}

export function refreshSession(refreshToken: string) {
  const sessionId = readLive(refreshTokens, refreshToken)
  if (!sessionId || !sessions.has(sessionId)) {
    return undefined
  }
  refreshTokens.delete(refreshToken)
  return issueTokens(sessionId)
}

export function revokeTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    accessTokens.delete(accessToken)
  }
  if (refreshToken) {
    refreshTokens.delete(refreshToken)
  }
}

export function getSessionId(accessToken?: string): string | undefined {
  const sessionId = accessToken
    ? readLive(accessTokens, accessToken)
    : undefined
  return sessionId && sessions.has(sessionId) ? sessionId : undefined
}

export function getSessionCustomerId(sessionId?: string): string | undefined {
  return sessionId ? sessions.get(sessionId)?.customerId : undefined
}

export function findCustomerByEmail(email: string): MockCustomer | undefined {
  const normalized = email.trim().toLowerCase()
  for (const customer of customers.values()) {
    if (customer.email.toLowerCase() === normalized) {
      return customer
    }
  }
  return undefined
}

export function getCustomer(customerId?: string): MockCustomer | undefined {
  return customerId ? customers.get(customerId) : undefined
}

export function saveCustomer(customer: MockCustomer) {
  setCapped(customers, customer.id, customer)
}

function issueOneTimeToken(
  store: Map<string, ExpiringEntry<string>>,
  customerId: string
) {
  const token = newToken()
  setCapped(store, token, {
    value: customerId,
    expiresAt: Date.now() + ONE_TIME_TOKEN_TTL_MS,
  })
  return token
}

function redeemOneTimeToken(
  store: Map<string, ExpiringEntry<string>>,
  token: string
): { customerId: string } | 'token_invalid' | 'token_expired' {
  const entry = store.get(token)
  if (!entry) {
    return 'token_invalid'
  }
  store.delete(token)
  return entry.expiresAt < Date.now()
    ? 'token_expired'
    : { customerId: entry.value }
}

export const issueEmailToken = (customerId: string) =>
  issueOneTimeToken(emailTokens, customerId)

export const redeemEmailToken = (token: string) =>
  redeemOneTimeToken(emailTokens, token)

export const issuePasswordToken = (customerId: string) =>
  issueOneTimeToken(passwordTokens, customerId)

export const redeemPasswordToken = (token: string) =>
  redeemOneTimeToken(passwordTokens, token)

export function toCustomerResponse(customer: MockCustomer): CustomerResponse {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    salutation: customer.salutation,
    dateOfBirth: customer.dateOfBirth,
    version: customer.version,
    isEmailVerified: customer.isEmailVerified,
  }
}
