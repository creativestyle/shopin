/**
 * The commerce contract suite against recorded commercetools responses (test/recorded/commerce-contract.json, made
 * by record-contract.mjs against a real project). Every case that passed while recording runs again on its own
 * recording: the port asks for the same requests and must reach the same result, with no network (a request it did
 * not make while recording fails, naming it).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import testing from '@core/integration-kit/testing'
import { contractCases, RECORDED, RECORDING } from './contract-run.mjs'

const { recordedFetch } = testing
const recording = JSON.parse(readFileSync(RECORDING, 'utf8'))
const OPTIONS = {
  ...RECORDED,
  clientId: 'recorded',
  clientSecret: 'recorded',
  linkCustomers: '1',
}

describe('commercetools commerce port: the commerce contract (recorded responses)', () => {
  const cases = contractCases(OPTIONS, recording.data)
  const passed = cases.filter(
    (c) => recording.cases[c.name]?.outcome === 'passed'
  )

  it('the recording covers the cart, customer and order cases', () => {
    const names = passed.map((c) => c.name).join('\n')
    for (const kind of ['cart', 'customer', 'order']) {
      assert.match(names, new RegExp(kind), `no recorded ${kind} case`)
    }
  })

  for (const c of passed) {
    it(c.name, async () => {
      const replay = recordedFetch(recording.cases[c.name].responses)
      const real = globalThis.fetch
      globalThis.fetch = replay
      try {
        await c.run()
      } finally {
        globalThis.fetch = real
      }
      assert.ok(replay.calls.length > 0, 'the case made no request')
    })
  }
})
