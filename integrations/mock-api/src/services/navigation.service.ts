import { Injectable, Inject } from '@nestjs/common'
import { MOCK_API, MockApi } from '../client/client.module'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type { LinkResponse } from '@core/contracts/core/link'
import { generateSeed } from '../helpers/generateSeed'

function createMainNavigation(
  faker: ReturnType<MockApi['getFaker']>
): MainNavigationResponse {
  let globalCounter = 0

  return {
    items: [
      ...faker.helpers.multiple(
        () => {
          const text = faker.commerce.department()
          const slug = `${faker.helpers.slugify(text).toLocaleLowerCase()}-${globalCounter++}`

          // Generate 2nd level subcategories (2-4 subcategories per category)
          const children = faker.helpers.multiple(
            () => {
              const subcategoryText = faker.commerce.productAdjective()
              const subcategorySlug = `${faker.helpers
                .slugify(subcategoryText)
                .toLocaleLowerCase()}-${globalCounter++}`

              // Generate 3rd level items (3-6 items per subcategory)
              const thirdLevelChildren = faker.helpers.multiple(
                (_, itemIndex) => {
                  const childText = faker.commerce.product()
                  const childSlug = `${faker.helpers
                    .slugify(childText)
                    .toLocaleLowerCase()}-${globalCounter++}`

                  // Add 4th level children to first 2 items of every subcategory
                  const shouldHaveFourthLevel = itemIndex < 2
                  const fourthLevelChildren = shouldHaveFourthLevel
                    ? faker.helpers.multiple(
                        () => {
                          const fourthText = faker.commerce.productMaterial()
                          const fourthSlug = `${faker.helpers
                            .slugify(fourthText)
                            .toLocaleLowerCase()}-${globalCounter++}`
                          return {
                            text: fourthText,
                            href: `/c/${fourthSlug}`,
                          }
                        },
                        { count: { min: 2, max: 4 } }
                      )
                    : undefined

                  return {
                    text: childText,
                    href: `/c/${childSlug}`,
                    ...(fourthLevelChildren && {
                      children: fourthLevelChildren,
                    }),
                  }
                },
                { count: { min: 3, max: 6 } }
              )

              return {
                text: subcategoryText,
                href: `/c/${subcategorySlug}`,
                children: thirdLevelChildren,
              }
            },
            { count: { min: 2, max: 4 } }
          )

          // Generate featured product for some categories
          const hasFeaturedProduct = faker.datatype.boolean()
          const featuredProduct = hasFeaturedProduct
            ? {
                id: faker.string.uuid(),
                name: faker.commerce.productName(),
                slug: `${faker.helpers
                  .slugify(faker.commerce.productName())
                  .toLocaleLowerCase()}-${globalCounter++}`,
                image: {
                  src: `https://picsum.photos/seed/${faker.string.uuid()}/400/400`,
                  alt: faker.commerce.productName(),
                },
                price: {
                  regularPriceInCents: faker.number.int({
                    min: 1999,
                    max: 29999,
                  }),
                  currency: 'EUR',
                  fractionDigits: 2,
                },
              }
            : undefined

          return {
            text,
            href: `/c/${slug}`,
            children,
            featuredProduct,
          }
        },
        { count: 5 }
      ),
      {
        text: 'Sale',
        href: '/c/sale',
        isHighlighted: true,
      } as LinkResponse,
    ],
  }
}

@Injectable()
export class NavigationService {
  constructor(@Inject(MOCK_API) private readonly mockApi: MockApi) {}

  async getNavigation(): Promise<MainNavigationResponse> {
    const faker = this.mockApi.getFaker()
    faker.seed(generateSeed('s'))
    return createMainNavigation(faker)
  }
}
