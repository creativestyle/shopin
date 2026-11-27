import {
  ConflictException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common'
import type { Customer } from '@commercetools/platform-sdk'
import {
  PortOptions,
  type CustomerRecord,
  type Port,
  type SignedIn,
} from '@core/integration-kit'
import {
  COMMERCETOOLS_CLIENT,
  type Client,
} from '@integrations/commercetools-core'
import type { CommercetoolsOptions } from '@integrations/commercetools-core'
import { quoted } from '@integrations/commercetools-core'
import { isDuplicateEmailError } from '@integrations/commercetools-core'

/**
 * Customer lookups and writes for the BFF's linking policy: Customer.externalId = `<provider>:<subject>`;
 * customers created for an external identity get `authenticationMode: ExternalAuth` (no password here).
 * This part decides nothing: the core asks for exactly one lookup or write.
 */
@Injectable()
export class CommercetoolsCustomerStore implements NonNullable<
  Port<'commerce'>['customers']
> {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(PortOptions) private readonly options: CommercetoolsOptions
  ) {}

  /** One customer, or none; two (an e-mail in several stores, a duplicate) is a conflict, never an arbitrary pick. */
  private async find(where: string): Promise<CustomerRecord | undefined> {
    const results: Customer[] = (
      await this.client
        .customers()
        .get({ queryArgs: { where, limit: 2 } })
        .execute()
    ).body.results
    if (results.length > 1) {
      throw new ConflictException(
        'More than one customer matches this sign-in; it cannot be linked'
      )
    }
    const c = results[0]
    return (
      c && {
        id: c.id,
        hasPassword: c.authenticationMode !== 'ExternalAuth',
        ...(c.externalId ? { externalId: c.externalId } : {}),
      }
    )
  }

  findByExternalId(externalId: string) {
    return this.find(`externalId=${quoted(externalId)}`)
  }

  findByEmail(email: string) {
    return this.find(`lowercaseEmail=${quoted(email.toLowerCase())}`)
  }

  private guardWrites() {
    if (this.options.linkCustomers !== '1') {
      throw new NotImplementedException(
        'Signing in through another identity provider creates or links customers in this commercetools project; set COMMERCETOOLS_LINK_CUSTOMERS=1 to allow it'
      )
    }
  }

  async setExternalId(customerId: string, externalId: string): Promise<void> {
    this.guardWrites()
    const { body } = await this.client
      .customers()
      .withId({ ID: customerId })
      .get()
      .execute()
    await this.client
      .customers()
      .withId({ ID: customerId })
      .post({
        body: {
          version: body.version,
          actions: [{ action: 'setExternalId', externalId }],
        },
      })
      .execute()
  }

  async create(identity: SignedIn, externalId: string): Promise<string> {
    this.guardWrites()
    const [firstName, ...rest] = (identity.name ?? '').split(' ')
    try {
      const { body } = await this.client
        .customers()
        .post({
          body: {
            email: identity.email,
            externalId,
            authenticationMode: 'ExternalAuth',
            isEmailVerified: true,
            ...(firstName ? { firstName } : {}),
            ...(rest.length ? { lastName: rest.join(' ') } : {}),
          },
        })
        .execute()
      return body.customer.id
    } catch (error) {
      // another request created this customer meanwhile: a conflict the BFF resolves by looking again
      if (isDuplicateEmailError(error)) {
        throw new ConflictException('A customer with this e-mail exists')
      }
      throw error
    }
  }
}
