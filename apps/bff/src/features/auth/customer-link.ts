import { ConflictException, ForbiddenException } from '@nestjs/common'
import type { Port } from '@core/integration-kit'
import type { Identity } from '../../common/session/session.service'

/** The `customers` member of a commerce port. */
export type CustomerStore = NonNullable<Port<'commerce'>['customers']>

/**
 * The linking policy (core, not a part): which commerce customer an identity acts for. The commerce part
 * only performs the lookup or the write it is asked for.
 * - `native` (one integration serves both auth and commerce): the subject is the customer id.
 * - Else by external id `<provider>:<subject>`; `provider` is stamped by the BFF, never by a part.
 * - Else by verified e-mail, only to a customer that has neither an external id nor a password.
 * - Else a new customer.
 */
export async function linkCustomer(
  identity: Identity,
  store: CustomerStore | undefined,
  { native }: { native: boolean }
): Promise<string | undefined> {
  if (native) {
    return identity.subject
  }
  if (!store) {
    throw new ForbiddenException(
      'This commerce provider cannot link customer accounts'
    )
  }
  if (!identity.emailVerified) {
    throw new ForbiddenException(
      'The identity provider has not verified this e-mail address; it cannot be linked to a customer'
    )
  }
  const externalId = `${identity.provider}:${identity.subject}`
  const linked = await store.findByExternalId(externalId)
  if (linked) {
    return linked.id
  }
  const byEmail = await store.findByEmail(identity.email)
  if (byEmail && (byEmail.externalId || byEmail.hasPassword)) {
    throw new ConflictException(
      'An account with this e-mail already exists and cannot be linked to this sign-in'
    )
  }
  if (byEmail) {
    await store.setExternalId(byEmail.id, externalId)
    return byEmail.id
  }
  try {
    return await store.create(identity, externalId)
  } catch (error) {
    // two first sign-ins of the same identity at once: the other created the customer meanwhile (a duplicate
    // e-mail answers 409); take that customer when it carries this identity, else the conflict stands
    if ((error as { getStatus?: () => number }).getStatus?.() !== 409) {
      throw error
    }
    const meanwhile = await store.findByExternalId(externalId)
    if (meanwhile) {
      return meanwhile.id
    }
    throw error
  }
}
