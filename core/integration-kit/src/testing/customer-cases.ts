import assert from 'node:assert/strict'
import type { CaseContext } from './types'

/** Customers: lookups and writes the BFF uses to link a sign-in to a customer. */
export function customerCases(ctx: CaseContext): void {
  const { port, data, add, unique } = ctx
  if (data.customers) {
    add([], {
      name: 'commerce: customers are found by external id and e-mail, created without password, re-linked',
      async run() {
        const { customers } = await port()
        assert.ok(customers, 'the port has no `customers` member')
        const n = unique()
        const email = `contract-${n}@example.com`
        const externalId = `contract-idp:${n}`
        assert.equal(await customers.findByExternalId(externalId), undefined)
        assert.equal(await customers.findByEmail(email), undefined)
        const id = await customers.create(
          { subject: n, email, emailVerified: true, name: 'Contract Test' },
          externalId
        )
        assert.deepEqual(await customers.findByExternalId(externalId), {
          id,
          externalId,
          hasPassword: false,
        })
        // e-mail lookups ignore case
        assert.equal((await customers.findByEmail(email.toUpperCase()))?.id, id)
        await customers.setExternalId(id, `${externalId}-2`)
        assert.equal(
          (await customers.findByExternalId(`${externalId}-2`))?.id,
          id
        )
      },
    })
  }
}
