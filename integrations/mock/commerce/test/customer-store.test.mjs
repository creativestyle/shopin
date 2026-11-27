/**
 * The mock commerce customer store the BFF links identities through: lookups by external id and e-mail,
 * linking a further identity, creating a customer for an identity. Mock customers never have a password,
 * so the BFF's rule "never link an identity to a customer with a password" can never be bypassed here.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NotFoundException } from '@nestjs/common'
import account from '../dist/services/account.service.js'

const { MockCustomerStore, customerStore } = account
const identity = (email, name) => ({
  subject: `idp|${email}`,
  email,
  emailVerified: true,
  ...(name ? { name } : {}),
})

test('create stores a customer that is found by its external id and by e-mail (case-insensitive)', async () => {
  const store = new MockCustomerStore()
  const id = await store.create(
    identity('Ann.Lee@example.com', 'Ann Marie Lee'),
    'idp:ann'
  )
  assert.match(id, /^mock-customer-/)
  assert.deepEqual(await store.findByExternalId('idp:ann'), {
    id,
    hasPassword: false,
    externalId: 'idp:ann',
  })
  assert.equal((await store.findByEmail('ann.lee@EXAMPLE.com'))?.id, id)
  const stored = customerStore.get(id)
  assert.equal(stored.firstName, 'Ann')
  assert.equal(stored.lastName, 'Marie Lee')
})

test('setExternalId links a second identity to the same customer', async () => {
  const store = new MockCustomerStore()
  const id = await store.create(identity('bo@example.com'), 'idp-a:bo')
  const before = customerStore.get(id).version
  await store.setExternalId(id, 'idp-b:bo')
  assert.equal((await store.findByExternalId('idp-b:bo'))?.id, id)
  assert.equal((await store.findByExternalId('idp-a:bo'))?.id, id)
  assert.equal(customerStore.get(id).version, before + 1)
})

test('setExternalId on an unknown customer fails and links nothing', async () => {
  const store = new MockCustomerStore()
  await assert.rejects(
    store.setExternalId('mock-customer-missing', 'idp:ghost'),
    NotFoundException
  )
  assert.equal(await store.findByExternalId('idp:ghost'), undefined)
})

test('unknown external ids and e-mails are not found', async () => {
  const store = new MockCustomerStore()
  assert.equal(await store.findByExternalId('idp:nobody'), undefined)
  assert.equal(await store.findByEmail('nobody@example.com'), undefined)
})

test('no mock customer has a password, so none can be taken over by linking', async () => {
  const store = new MockCustomerStore()
  await store.create(identity('cy@example.com'), 'idp:cy')
  for (const c of customerStore.values()) {
    assert.equal((await store.findByEmail(c.email))?.hasPassword, false)
  }
})
