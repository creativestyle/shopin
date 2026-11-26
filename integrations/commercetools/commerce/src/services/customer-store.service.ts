import { Inject, Injectable, NotImplementedException } from '@nestjs/common'
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

  private async find(where: string): Promise<CustomerRecord | undefined> {
    const c: Customer | undefined = (
      await this.client
        .customers()
        .get({ queryArgs: { where, limit: 1 } })
        .execute()
    ).body.results[0]
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
  }
}
