/** Fixture users of the mock identity provider. Password for all: `mock-password`. */
export const MOCK_IDENTITY_USERS = [
  {
    subject: 'mock-idp|alice',
    email: 'alice@example.com',
    name: 'Alice Verified',
    emailVerified: true,
  },
  {
    subject: 'mock-idp|bob',
    email: 'bob@example.com',
    name: 'Bob Unverified',
    emailVerified: false,
  },
] as const

export const MOCK_IDENTITY_PASSWORD = 'mock-password'
