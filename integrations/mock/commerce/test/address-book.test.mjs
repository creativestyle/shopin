/**
 * A signed-in customer's address book on the mock. The checkout saves a customer's first address into it, so a
 * signed-in checkout stops at billing when the mock refuses (it answered 501 before).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import account from '../dist/services/account.service.js'

const { MockCustomerAddressService, customerStore } = account

const address = {
  firstName: 'Ann',
  lastName: 'Tester',
  streetName: 'Main St',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
}

function signedIn(id) {
  customerStore.set(id, {
    id,
    email: `${id}@example.com`,
    externalIds: [],
    version: 1,
  })
  return new MockCustomerAddressService({ customerId: async () => id })
}

test('a customer adds an address and sees it, with the defaults it asked for', async () => {
  const book = signedIn('c-add')
  const added = await book.addAddress({ ...address, isDefaultBilling: true })
  assert.match(added.id, /^mock-address-/)
  const { addresses, defaultBillingAddressId, defaultShippingAddressId } =
    await book.getAddresses()
  assert.equal(addresses.length, 1)
  assert.equal(addresses[0].city, 'Berlin')
  assert.equal(defaultBillingAddressId, added.id)
  assert.equal(defaultShippingAddressId, undefined)
})

test('update replaces the fields, defaults move, delete clears the default', async () => {
  const book = signedIn('c-edit')
  const a = await book.addAddress(address)
  await book.updateAddress({ ...address, id: a.id, city: 'Hamburg' })
  await book.setDefaultShippingAddress(a.id)
  let read = await book.getAddresses()
  assert.equal(read.addresses[0].city, 'Hamburg')
  assert.equal(read.defaultShippingAddressId, a.id)
  await book.deleteAddress(a.id)
  read = await book.getAddresses()
  assert.equal(read.addresses.length, 0)
  assert.equal(read.defaultShippingAddressId, undefined)
})

test("a customer cannot touch another customer's address", async () => {
  const owner = signedIn('c-owner')
  const other = signedIn('c-other')
  const a = await owner.addAddress(address)
  await assert.rejects(other.deleteAddress(a.id), NotFoundException)
  await assert.rejects(other.setDefaultBillingAddress(a.id), NotFoundException)
  assert.equal((await owner.getAddresses()).addresses.length, 1)
})

test('a guest has no address book', async () => {
  await assert.rejects(
    new MockCustomerAddressService().getAddresses(),
    UnauthorizedException
  )
})
