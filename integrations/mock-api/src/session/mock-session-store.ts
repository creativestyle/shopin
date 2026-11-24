import { createHash, randomBytes, randomUUID } from 'crypto'
import type { AddressResponse } from '@core/contracts/customer/address'
import type { CustomerResponse } from '@core/contracts/customer/customer'

/** Seconds a mock access token lives, matching the commercetools default. */
export const MOCK_ACCESS_TOKEN_TTL_SECONDS = 172800

const TOKEN_TTL_MS = 60 * 60 * 1000

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

interface MockOneTimeToken {
  customerId: string
  expiresAt: number
}

// In-memory stores shared by the mock auth, customer, cart and order services
const customers = new Map<string, MockCustomer>()
const sessions = new Map<string, MockSession>()
const accessTokens = new Map<string, string>()
const refreshTokens = new Map<string, string>()
const emailTokens = new Map<string, MockOneTimeToken>()
const passwordTokens = new Map<string, MockOneTimeToken>()

const newToken = () => randomBytes(24).toString('base64url')

export const hashPassword = (password: string) =>
  createHash('sha256').update(password).digest('hex')

function issueTokens(sessionId: string) {
  const accessToken = newToken()
  const refreshToken = newToken()
  accessTokens.set(accessToken, sessionId)
  refreshTokens.set(refreshToken, sessionId)
  return {
    accessToken,
    refreshToken,
    expiresIn: MOCK_ACCESS_TOKEN_TTL_SECONDS,
  }
}

export function createSession(customerId?: string) {
  const session: MockSession = { id: randomUUID(), customerId }
  sessions.set(session.id, session)
  return issueTokens(session.id)
}

export function refreshSession(refreshToken: string) {
  const sessionId = refreshTokens.get(refreshToken)
  if (!sessionId) {
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
  return accessToken ? accessTokens.get(accessToken) : undefined
}

export function getSessionCustomerId(sessionId?: string): string | undefined {
  return sessionId ? sessions.get(sessionId)?.customerId : undefined
}

/** Gives a guest session to a customer, so its carts and orders follow the sign-in. */
export function assignSessionToCustomer(sessionId: string, customerId: string) {
  const session = sessions.get(sessionId)
  if (session && !session.customerId) {
    session.customerId = customerId
  }
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
  store: Map<string, MockOneTimeToken>,
  customerId: string
) {
  const token = newToken()
  store.set(token, { customerId, expiresAt: Date.now() + TOKEN_TTL_MS })
  return token
}

function redeemOneTimeToken(
  store: Map<string, MockOneTimeToken>,
  token: string
): { customerId: string } | 'token_invalid' | 'token_expired' {
  const entry = store.get(token)
  if (!entry) {
    return 'token_invalid'
  }
  store.delete(token)
  return entry.expiresAt < Date.now()
    ? 'token_expired'
    : { customerId: entry.customerId }
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
