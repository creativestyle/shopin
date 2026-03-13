import type { CategoryTreeNode } from '@core/contracts/product-collection/product-collection'
import type { MockApi } from '../client/client.module'

type Faker = ReturnType<MockApi['getFaker']>

export function generateMockCategoryTree(
  faker: Faker,
  currentSlug: string,
  currentCategory: string
): { categoryTree: CategoryTreeNode[]; currentCategoryId: string } {
  const currentCategoryId = faker.string.uuid()

  const siblings: CategoryTreeNode[] = []
  for (let i = 0; i < 4; i++) {
    const name = faker.commerce.department()
    siblings.push({
      id: faker.string.uuid(),
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
    })
  }

  const children: CategoryTreeNode[] = []
  for (let i = 0; i < 3; i++) {
    const name = faker.commerce.productAdjective() + ' ' + currentCategory
    children.push({
      id: faker.string.uuid(),
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
    })
  }

  const categoryTree: CategoryTreeNode[] = [
    {
      id: currentCategoryId,
      name: currentCategory,
      slug: currentSlug,
      children,
    },
    ...siblings,
  ]

  return { categoryTree, currentCategoryId }
}
