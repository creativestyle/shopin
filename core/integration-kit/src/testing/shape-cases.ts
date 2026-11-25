import assert from 'node:assert/strict'
import { COMMERCE, type CaseContext } from './types'
import { statusOf } from './helpers'

/** Every service and method the BFF calls is there, and none is a 501 stub. */
export function shapeCases(ctx: CaseContext): void {
  const { port, add } = ctx
  add([], {
    name: 'commerce: every service and method the BFF calls is there',
    async run() {
      const p = (await port()) as unknown as Record<
        string,
        Record<string, unknown>
      >
      for (const [service, { methods, optional }] of Object.entries(COMMERCE)) {
        if (optional && p[service] === undefined) {
          continue
        }
        assert.ok(p[service], `${service} is missing`)
        for (const m of methods) {
          assert.equal(
            typeof p[service]![m],
            'function',
            `${service}.${m} is missing`
          )
        }
      }
    },
  })
  // a method that answers 501 is a stub (`todo`): one case per method, so a connector lists exactly what is left
  for (const [service, { methods }] of Object.entries(COMMERCE)) {
    for (const method of methods) {
      add([`${service}.${method}`], {
        name: `commerce: ${service}.${method} is written (a stub answers 501)`,
        async run() {
          const p = (await port()) as unknown as Record<
            string,
            Record<string, (...args: unknown[]) => unknown>
          >
          let error: unknown
          try {
            // called without arguments: only whether it answers 501 matters, any other outcome means it is written
            await p[service]![method]!()
          } catch (e) {
            error = e
          }
          assert.notEqual(
            statusOf(error),
            501,
            `${service}.${method} answers 501 (not written yet)`
          )
        },
      })
    }
  }
}
