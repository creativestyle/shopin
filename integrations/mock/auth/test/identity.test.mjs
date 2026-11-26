/**
 * The mock identity provider implements Port<'auth'>: it returns who signed in (never a password), rejects a
 * wrong password, signs up new identities, refuses a duplicate e-mail and refuses to refresh an identity it no
 * longer knows. The descriptor wires it as the auth port and only pairs it with mock commerce.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import identity from '../dist/identity.js'
import fixtures from '../dist/fixtures.js'
import descriptor from '../dist/shopin.js'

const { MockIdentityProvider, default: authPort } = identity
const { MOCK_IDENTITY_PASSWORD } = fixtures

test('signIn returns the fixture identity without the password', async () => {
  const { identity: signedIn } = await new MockIdentityProvider().signIn({
    email: 'Alice@Example.com',
    password: MOCK_IDENTITY_PASSWORD,
  })
  assert.deepEqual(signedIn, {
    subject: 'mock-idp|alice',
    email: 'alice@example.com',
    name: 'Alice Verified',
    emailVerified: true,
  })
})

test('signIn rejects a wrong password and an unknown e-mail', async () => {
  const idp = new MockIdentityProvider()
  await assert.rejects(
    idp.signIn({ email: 'alice@example.com', password: 'wrong' }),
    UnauthorizedException
  )
  await assert.rejects(
    idp.signIn({
      email: 'nobody@example.com',
      password: MOCK_IDENTITY_PASSWORD,
    }),
    UnauthorizedException
  )
})

test('signUp creates an identity that can then sign in; a second sign-up with the e-mail conflicts', async () => {
  const idp = new MockIdentityProvider()
  const { identity: created } = await idp.signUp({
    email: 'New.User@Example.com',
    password: 'secret-1',
    firstName: 'New',
    lastName: 'User',
  })
  assert.deepEqual(created, {
    subject: 'mock-idp|new.user@example.com',
    email: 'new.user@example.com',
    emailVerified: true,
    name: 'New User',
  })
  const { identity: signedIn } = await idp.signIn({
    email: 'new.user@example.com',
    password: 'secret-1',
  })
  assert.equal(signedIn.subject, created.subject)
  assert.equal('password' in signedIn, false)
  await assert.rejects(
    idp.signUp({ email: 'new.user@example.com', password: 'other' }),
    ConflictException
  )
})

test('refresh returns the current identity and rejects one it does not know', async () => {
  const idp = new MockIdentityProvider()
  const fresh = await idp.refresh({
    subject: 'mock-idp|bob',
    email: 'bob@example.com',
    emailVerified: true,
    provider: 'mock-identity',
  })
  // the stored identity wins over what the session claimed
  assert.equal(fresh.emailVerified, false)
  await assert.rejects(
    idp.refresh({
      subject: 'mock-idp|deleted',
      email: 'deleted@example.com',
      emailVerified: true,
      provider: 'mock-identity',
    }),
    UnauthorizedException
  )
  // same e-mail, different subject: not the same identity
  await assert.rejects(
    idp.refresh({
      subject: 'other-idp|bob',
      email: 'bob@example.com',
      emailVerified: false,
      provider: 'mock-identity',
    }),
    UnauthorizedException
  )
})

test('the auth port returns the provider it injects', () => {
  assert.equal(authPort.category, 'auth')
  assert.deepEqual(authPort.inject, [MockIdentityProvider])
  const idp = new MockIdentityProvider()
  assert.equal(authPort.useFactory(idp), idp)
})

test('the descriptor serves auth only, loads the auth port, and needs mock commerce', () => {
  const integration = descriptor.mockIdentity()
  assert.equal(integration.id, 'mock-identity')
  assert.deepEqual(Object.keys(integration.ports), ['auth'])
  assert.equal(integration.ports.auth(), authPort)
  assert.deepEqual(integration.requires.auth.needs, { commerce: 'mock' })
})
