/**
 * Tests every commerce integration runs against its own port (`@core/integration-kit/testing`):
 * `buildPort` builds a port the way the BFF does (its Nest providers, its options, a token vault, the customer and
 * request context), and `commerceContract` lists the cases the port must pass. The cases use `node:assert`, so
 * they run under `node --test` and Jest alike:
 *
 *   for (const c of commerceContract((as) => buildPort(myCommerce().ports.commerce(), { storefrontUrl, ...as }), data)) test(c.name, c.run)
 *
 * A connector that talks HTTP to its platform tests against recorded responses: `recordedFetch` answers from
 * responses saved once from the real API (JSON next to the test) and fails on any request it has no recording for.
 *
 * A case that cannot run here is reported as skipped with the reason, never as passed: a member the port leaves out,
 * data the case needs, or a failure the suite cannot inject. Under node:test (`test(c.name, c.run)` hands `run` the
 * test context) it shows as skipped; Jest cannot skip a running test, so there it logs "not run: …" instead.
 *
 * A method that answers 501 (a `todo` stub) fails its case. A connector that is not done yet lists what it has not
 * written and reports those cases as to-do (node:test's `todo`), by the services or `service.method` names each
 * case names in `services`:
 *
 *   const notDoneYet = ['customerAddressService', 'cartService.setShippingAddress']
 *   const todo = c.services.some((s) => notDoneYet.includes(s))
 *   test(c.name, { todo }, todo ? quietly(c.run) : c.run)
 *
 * where `quietly` returns when the case fails (a stub, as expected) and throws when it passes (written now: take it
 * off the list), so a passing run prints no "failing tests" list.
 */
export type {
  ActingAs,
  CommerceContractData,
  ContractCase,
} from './testing/types'
export { commerceContract } from './testing/commerce-contract'
export * from './testing/recorded-fetch'
export { buildPort } from './testing/build-port'
