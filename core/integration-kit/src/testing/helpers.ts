import assert from 'node:assert/strict'

export function statusOf(error: unknown): number | undefined {
  const e = error as {
    getStatus?: () => number
    status?: number
    statusCode?: number
  }
  return e?.getStatus?.() ?? e?.status ?? e?.statusCode
}

export async function rejectsWith(
  status: number | number[],
  promise: Promise<unknown>
) {
  const allowed = [status].flat()
  await assert.rejects(promise, (error) => {
    assert.ok(
      allowed.includes(statusOf(error) ?? 0),
      `expected ${allowed.join(' or ')}, got ${String(error)}`
    )
    return true
  })
}

/** A postal address the checkout and address-book cases use. */
export const ADDRESS = {
  firstName: 'Contract',
  lastName: 'Test',
  email: 'contract@example.com',
  streetName: 'Main Street',
  streetNumber: '1',
  postalCode: '10115',
  city: 'Testville',
  country: 'US',
}

/**
 * The cases a commerce port must pass. `port` builds a fresh port (call `buildPort`); `data` names what its data
 * holds. Shape and contract parsing come from SHOPin's own schemas, so a port that maps a field wrong fails here,
 * not in the storefront.
 */
