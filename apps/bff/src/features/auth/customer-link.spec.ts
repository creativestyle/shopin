import { ConflictException } from '@nestjs/common'
import type { CustomerRecord } from '@core/integration-kit'
import type { Identity } from '../../common/session/session.service'
import { linkCustomer, type CustomerStore } from './customer-link'

/** An in-memory customer store that records every call: the policy decides, the store only obeys. */
function store(customers: (CustomerRecord & { email: string })[]) {
  const calls: string[] = []
  const s: CustomerStore = {
    findByExternalId: async (x) => (
      calls.push(`find ext ${x}`),
      customers.find((c) => c.externalId === x)
    ),
    findByEmail: async (e) => (
      calls.push(`find email ${e}`),
      customers.find((c) => c.email === e)
    ),
    setExternalId: async (id, x) => void calls.push(`set ${id} ${x}`),
    create: async (_i, x) => (calls.push(`create ${x}`), 'new-1'),
  }
  return { s, calls }
}
const alice: Identity = {
  provider: 'idp',
  subject: 'a1',
  email: 'alice@example.com',
  emailVerified: true,
}

describe('linking policy (core)', () => {
  it('never links by e-mail to a customer with a password (account takeover)', async () => {
    const { s, calls } = store([
      { id: 'victim', email: 'alice@example.com', hasPassword: true },
    ])
    await expect(
      linkCustomer(alice, s, { native: false })
    ).rejects.toMatchObject({ status: 409 })
    expect(calls).toEqual(['find ext idp:a1', 'find email alice@example.com'])
  })

  it('never links by e-mail to a customer that already has another external id', async () => {
    const { s, calls } = store([
      {
        id: 'c2',
        email: 'alice@example.com',
        hasPassword: false,
        externalId: 'other:z',
      },
    ])
    await expect(
      linkCustomer(alice, s, { native: false })
    ).rejects.toMatchObject({ status: 409 })
    expect(
      calls.some((c) => c.startsWith('set') || c.startsWith('create'))
    ).toBe(false)
  })

  it('links by e-mail only to a customer with neither, and writes the external id', async () => {
    const { s, calls } = store([
      { id: 'c3', email: 'alice@example.com', hasPassword: false },
    ])
    expect(await linkCustomer(alice, s, { native: false })).toBe('c3')
    expect(calls).toEqual([
      'find ext idp:a1',
      'find email alice@example.com',
      'set c3 idp:a1',
    ])
  })

  it('finds by external id first, creates when nobody matches, refuses an unverified e-mail', async () => {
    expect(
      await linkCustomer(
        alice,
        store([
          { id: 'c4', email: 'x', hasPassword: true, externalId: 'idp:a1' },
        ]).s,
        { native: false }
      )
    ).toBe('c4')
    expect(await linkCustomer(alice, store([]).s, { native: false })).toBe(
      'new-1'
    )
    const { s, calls } = store([])
    await expect(
      linkCustomer({ ...alice, emailVerified: false }, s, { native: false })
    ).rejects.toMatchObject({ status: 403 })
    expect(calls).toEqual([])
  })

  it('native sign-in (one integration serves auth and commerce): the subject is the customer id, no lookup', async () => {
    const { s, calls } = store([])
    expect(
      await linkCustomer({ ...alice, subject: 'ct-7' }, s, { native: true })
    ).toBe('ct-7')
    expect(calls).toEqual([])
  })
})

describe('linkCustomer: two first sign-ins of the same identity at once', () => {
  const identity = {
    provider: 'idp',
    subject: 'race',
    email: 'race@example.com',
    emailVerified: true,
  }
  it('the second takes the customer the first created (the create answered 409)', async () => {
    let created = false
    const store: CustomerStore = {
      findByExternalId: async () =>
        created ? { id: 'c-first', hasPassword: false } : undefined,
      findByEmail: async () => undefined,
      setExternalId: async () => undefined,
      create: async () => {
        created = true // the other request won the race
        throw new ConflictException('A customer with this e-mail exists')
      },
    }
    await expect(
      linkCustomer(identity, store, { native: false })
    ).resolves.toBe('c-first')
  })
  it('a conflict that is not this identity stands (another account owns the e-mail)', async () => {
    const store: CustomerStore = {
      findByExternalId: async () => undefined,
      findByEmail: async () => undefined,
      setExternalId: async () => undefined,
      create: async () => {
        throw new ConflictException('A customer with this e-mail exists')
      },
    }
    await expect(
      linkCustomer(identity, store, { native: false })
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
