import { createHash, randomBytes, randomUUID } from 'crypto'
import { REFRESH_TOKEN_MAX_AGE } from '@config/constants'
import type { AddressResponse } from '@core/contracts/customer/address'
import type { CustomerResponse } from '@core/contracts/customer/customer'

/** Seconds a mock access token lives, matching the commercetools default. */
export const MOCK_ACCESS_TOKEN_TTL_SECONDS = 172800

const ACCESS_TOKEN_TTL_MS = MOCK_ACCESS_TOKEN_TTL_SECONDS * 1000
const ONE_TIME_TOKEN_TTL_MS = 60 * 60 * 1000
const SWEEP_INTERVAL_MS = 60 * 1000

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

export const hashPassword = (password: string) =>
  createHash('sha256').update(password).digest('hex')

function readLive<T>(store: Map<string, ExpiringEntry<T>>, key: string) {
  const entry = store.get(key)
  if (entry && entry.expiresAt < Date.now()) {
    store.delete(key)
    return undefined
  }
  return entry?.value
}

/** Drops expired tokens, and guest sessions no token points to any more. */
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
  for (const [id, session] of sessions) {
    if (!session.customerId && !live.has(id)) {
      sessions.delete(id)
    }
  }
}

function issueTokens(sessionId: string) {
  const accessToken = newToken()
  const refreshToken = newToken()
  const now = Date.now()
  accessTokens.set(accessToken, {
    value: sessionId,
    expiresAt: now + ACCESS_TOKEN_TTL_MS,
  })
  refreshTokens.set(refreshToken, {
    value: sessionId,
    expiresAt: now + REFRESH_TOKEN_MAX_AGE,
  })
  return {
    accessToken,
    refreshToken,
    expiresIn: MOCK_ACCESS_TOKEN_TTL_SECONDS,
  }
}

/** A new session (a guest one without a customer id) with its first tokens. */
export function openSession(customerId?: string) {
  sweepExpired()
  const session: MockSession = { id: randomUUID(), customerId }
  sessions.set(session.id, session)
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
  customers.set(customer.id, customer)
}

function issueOneTimeToken(
  store: Map<string, ExpiringEntry<string>>,
  customerId: string
) {
  const token = newToken()
  store.set(token, {
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
