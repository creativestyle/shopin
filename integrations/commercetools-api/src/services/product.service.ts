import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductResponse } from '@core/contracts/product/product'
import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { mapVariantPriceToShopin } from '../mappers/price'
import { mapBadges } from '../mappers/badges'
import { mapConfigurableOptions } from '../mappers/configurable-options'
import { mapVariantToGallery } from '../mappers/gallery'
import { mapVariantsToShopin } from '../mappers/variants'
import { ProductProjectionPagedQueryApiResponseSchema } from '../schemas/product-projection'
import type { Category, LocalizedString } from '@commercetools/platform-sdk'

@Injectable()
export class ProductService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async getProduct(
    productSlug: string,
    variantId?: string
  ): Promise<ProductResponse> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()

    const response = await this.client
      .productProjections()
      .get({
        queryArgs: {
          where: `slug(${currentLanguage}="${productSlug}")`,
          staged: false,
          localeProjection: currentLanguage,
          expand: [
            'productType',
            'categories[*]',
            'categories[*].ancestors[*]',
          ],
          limit: 1,
        },
      })
      .execute()

    const pagedResponse = ProductProjectionPagedQueryApiResponseSchema.parse(
      response.body
    )
    const product = pagedResponse.results[0]
    if (!product) {
      throw new NotFoundException(`Product not found for slug: ${productSlug}`)
    }

    const masterVariant = product.masterVariant
    const allVariants = [masterVariant, ...(product.variants || [])]
    const selectedVariant =
      (variantId && allVariants.find((v) => String(v.id) === variantId)) ||
      masterVariant

    const name =
      mapLocalized(
        product.name as LocalizedStringApiResponse | undefined,
        currentLanguage
      ) || 'Unnamed Product'
    const slug =
      mapLocalized(
        product.slug as LocalizedStringApiResponse | undefined,
        currentLanguage
      ) || product.id
    // Price mapping with discount if available (minor units)
    const firstPrice = selectedVariant.prices?.[0]
    const regularPriceCents = firstPrice?.value.centAmount
    const discountedCents = firstPrice?.discounted?.value.centAmount

    const badges = mapBadges(
      regularPriceCents,
      discountedCents,
      product.createdAt
    )

    const defs = product.productType?.obj?.attributes
    const defsByName = defs
      ? Object.fromEntries(defs.map((d) => [d.name, d]))
      : undefined
    const shopinVariants = mapVariantsToShopin(
      allVariants,
      currentLanguage,
      defsByName
    )
    const variantIdToImage: Record<string, string> = Object.fromEntries(
      allVariants
        .map(
          (v) =>
            [String(v.id), v.images?.[0]?.url as string | undefined] as const
        )
        .filter(([, url]) => Boolean(url)) as Array<[string, string]>
    )
    const configurableOptions = mapConfigurableOptions(
      shopinVariants,
      variantIdToImage
    )

    return {
      product: {
        id: product.id,
        name,
        slug,
        variantId: String(selectedVariant.id),
        description:
          mapLocalized(
            product.description as LocalizedStringApiResponse | undefined,
            currentLanguage
          ) || '',
        seoText:
          mapLocalized(
            product.metaDescription as LocalizedStringApiResponse | undefined,
            currentLanguage
          ) || undefined,
        price: mapVariantPriceToShopin(selectedVariant, currentLanguage),
        gallery: mapVariantToGallery(selectedVariant),
        badges,
        // deliveryEstimate is not available from commercetools by default
        configurableOptions,
        variants: shopinVariants,
      },
      breadcrumb: [
        ...this.resolveCategoryBreadcrumb(
          (
            product.categories?.[0] as
              | { id: string; obj?: Category }
              | undefined
          )?.obj,
          currentLanguage
        ),
        { label: name, path: `/p/${slug}` },
      ],
    }
  }

  private resolveCategoryBreadcrumb(
    category: Category | undefined,
    language: string
  ): { label: string; path: string }[] {
    if (!category) {
      return []
    }

    const ancestors = (category.ancestors ?? []) as Array<{
      id: string
      obj?: Category
    }>

    return [
      ...ancestors.flatMap((ref) => (ref.obj ? [ref.obj] : [])),
      category,
    ].flatMap((cat) => {
      const slug = mapLocalized(cat.slug as LocalizedString, language)
      if (!slug) {
        return []
      }
      return [
        {
          label: mapLocalized(cat.name as LocalizedString, language) || slug,
          path: `/c/${slug}`,
        },
      ]
    })
  }
}
