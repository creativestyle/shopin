'use client'

import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react'

import type { StorefrontSlots } from '@core/integration-kit'

/** The props a slot's component takes (from the kit's slot types). */
type PropsOf<K extends keyof StorefrontSlots> =
  NonNullable<StorefrontSlots[K]> extends (props: infer P) => unknown
    ? P
    : never

/**
 * The shop's client slots as elements, rendered by the server layout (`@/lib/slots` is server-only): the browser
 * bundle gets only these components, never the shop's whole storefront file with its server pages. A mount adds the
 * props it knows on the client (consent, the cart) with `cloneElement`; such a slot is a client component.
 */
export interface ClientSlots {
  siteNotice?: ReactElement
  trackingTags?: ReactElement<PropsOf<'TrackingTags'>>
  cartExtra?: ReactElement<PropsOf<'CartExtra'>>
}

const Slots = createContext<ClientSlots>({})

export function ClientSlotsProvider({
  children,
  ...slots
}: ClientSlots & { children: ReactNode }) {
  return <Slots.Provider value={slots}>{children}</Slots.Provider>
}

export const useClientSlots = (): ClientSlots => useContext(Slots)
