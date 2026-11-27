/**
 * @jest-environment node
 */
/**
 * The client slots (TrackingTags, CartExtra) are rendered by the server layout without their props and get them in
 * the browser (`cloneElement` in their mounts), so each must be a client component: a client reference (what the
 * bundler makes of a `'use client'` export on the server) passes; a server component throws, naming the slot.
 */
import type { clientSlot as ClientSlotFn } from '@/lib/slots'

/** A client reference as the RSC bundler hands a `'use client'` export to server code. */
const clientReference = (id: string) =>
  Object.defineProperties(
    function () {
      throw new Error('a client reference is not called on the server')
    },
    {
      $$typeof: { value: Symbol.for('react.client.reference') },
      $$id: { value: id },
    }
  )

function slotsWith(storefront: Record<string, unknown>): typeof ClientSlotFn {
  let clientSlot: typeof ClientSlotFn | undefined
  jest.isolateModules(() => {
    jest.doMock('server-only', () => ({}))
    jest.doMock('@shopin/storefront', () => storefront)
    jest.doMock('@shopin/storefront/wired', () => ({}))
    clientSlot = (require('@/lib/slots') as typeof import('@/lib/slots'))
      .clientSlot
  })
  return clientSlot!
}

describe('client slots', () => {
  it('passes a client component (client reference) and an empty slot', () => {
    const tags = clientReference('tags#TrackingTags')
    const extra = clientReference('extra#CartExtra')
    const clientSlot = slotsWith({ TrackingTags: tags, CartExtra: extra })
    expect(clientSlot('TrackingTags')).toBe(tags)
    expect(clientSlot('CartExtra')).toBe(extra)
    expect(slotsWith({})('CartExtra')).toBeUndefined()
  })

  it.each(['CartExtra', 'TrackingTags'] as const)(
    'throws naming %s when it is a server component',
    (name) => {
      const clientSlot = slotsWith({ [name]: () => null })
      expect(() => clientSlot(name)).toThrow(
        new RegExp(`storefront slot ${name} must be a client component`)
      )
    }
  )

  it('reading the other slots (routes, shop pages) does not trip over a server component in a client slot', () => {
    let pages: unknown
    jest.isolateModules(() => {
      jest.doMock('server-only', () => ({}))
      jest.doMock('@shopin/storefront', () => ({
        CartExtra: () => null,
        Pages: { about: () => null },
      }))
      jest.doMock('@shopin/storefront/wired', () => ({}))
      pages = (require('@/lib/slots') as typeof import('@/lib/slots')).Pages
    })
    expect(Object.keys(pages as object)).toEqual(['about'])
  })
})
