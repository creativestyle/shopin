import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import shopin from '../dist/shopin.js'

const { commercetoolsAuth } = shopin

describe('commercetools auth descriptor', () => {
  it('is the sign-in part of the commercetools provider: same id, only over commercetools commerce, no link switch', () => {
    const auth = commercetoolsAuth()
    assert.equal(auth.id, 'commercetools')
    assert.deepEqual(Object.keys(auth.ports), ['auth'])
    assert.deepEqual(Object.keys(auth.env), ['auth'])
    assert.equal('linkCustomers' in auth.env.auth, false)
    assert.deepEqual(auth.requires.auth.needs, { commerce: 'commercetools' })
  })
})
