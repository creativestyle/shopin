import { randomUUID } from 'node:crypto'
import { type Port } from '../index'
import {
  ContractCase,
  Run,
  ActingAs,
  CommerceContractData,
  COMMERCE,
  CaseContext,
} from './types'

import { shapeCases } from './shape-cases'
import { catalogCases } from './catalog-cases'
import { cartCases } from './cart-cases'
import { customerCases } from './customer-cases'
import { orderCases } from './order-cases'
/**
 * The commerce contract suite: every case a commerce port must pass. A case of a member the port leaves out is
 * skipped, unless the BFF needs that member (a required service).
 */
export function commerceContract(
  port: (as?: ActingAs) => Promise<Port<'commerce'>>,
  data: CommerceContractData
): ContractCase[] {
  const cases: { name: string; services: readonly string[]; run: Run }[] = []
  const add: CaseContext['add'] = (services, ...list) =>
    cases.push(...list.map((c) => ({ ...c, services })))
  const ctx: CaseContext = {
    port,
    data,
    add,
    unique: data.unique ?? (() => randomUUID().slice(0, 8)),
  }
  shapeCases(ctx)
  catalogCases(ctx)
  cartCases(ctx)
  customerCases(ctx)
  orderCases(ctx)
  return cases.map((c) => ({
    name: c.name,
    services: c.services,
    async run(...context: unknown[]) {
      const p = (await port()) as unknown as Record<string, unknown>
      const left = c.services
        .map((s) => s.split('.')[0]!)
        .find(
          (m) => !(COMMERCE[m] && !COMMERCE[m].optional) && p[m] === undefined
        )
      const why = left ? `skipped: the port has no ${left}` : await c.run()
      if (typeof why !== 'string') {
        return
      }
      const t = context[0] as { skip?: (reason: string) => void } | undefined
      if (typeof t?.skip === 'function') {
        t.skip(why)
      } else {
        // a runner without skip (Jest) would count the case as passed: fail instead, so a caller leaves out the
        // cases its port cannot run (filter them by name) rather than pass them silently
        throw new Error(
          `commerce contract case not run: ${c.name} (${why}); this test runner cannot skip it: leave it out`
        )
      }
    },
  }))
}
