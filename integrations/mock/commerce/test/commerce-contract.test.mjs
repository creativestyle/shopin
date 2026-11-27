/**
 * The mock commerce port passes the commerce contract suite every commerce integration runs
 * (`@core/integration-kit/testing`), built as the BFF builds it. What the mock does not do answers 501; its cases
 * are reported as to-do with the reason.
 */
import { test } from 'node:test'
import { PinoLogger } from 'nestjs-pino'
import { buildPort, commerceContract } from '@core/integration-kit/testing'
import descriptor from '../dist/shopin.js'

/** Answers 501 on purpose, with the reason (the cases that use them are reported as to-do). */
const notDone = {
  'customerService.changeCustomerPassword':
    'passwords belong to the identity provider',
  'customerService.changeCustomerEmail':
    'the sign-in e-mail belongs to the identity provider',
}

const silent = {
  setContext() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  trace() {},
}

/**
 * A to-do case (its method is still a stub) passes quietly, so a passing run prints no failure list; once the method
 * works the case fails, still as to-do: take it off the list.
 */
const quietly = (run) => async (t) => {
  try {
    await run(t)
  } catch {
    return
  }
  throw new Error('this case passes now: take it off the to-do list')
}

for (const c of commerceContract(
  (as) =>
    buildPort(descriptor.mock().ports.commerce(), {
      ...as,
      providers: [{ provide: PinoLogger, useValue: silent }],
    }),
  {
    product: { slug: 'contract-shirt' },
    generatedCatalog: true,
    category: { slug: 'women' },
    // the mock keeps any field beside the cart
    cart: { fields: { giftMessage: 'contract' } },
    // MOCK_DISCOUNT_CODES
    discountCodes: ['SAVE10', 'SAVE5'],
    customers: true,
    orders: true,
  }
)) {
  const todo = c.services.map((s) => notDone[s]).find(Boolean)
  test(c.name, { todo }, todo ? quietly(c.run) : c.run)
}
