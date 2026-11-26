import { RequestContext } from '@core/integration-kit'
import { Injectable, Inject, NotFoundException, Optional } from '@nestjs/common'
import { MapperHooks } from '../mapper-hooks'
import { COMMERCETOOLS_CLIENT, Client } from '@integrations/commercetools-core'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { resolveCountryFromLanguage } from '@core/i18n/language-tag-utils'
import type { ProductResponse } from '@core/contracts/product/product'
import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { mapVariantPriceToShopin } from '../mappers/price'
import { mapBadges } from '../mappers/badges'
import { mapConfigurableOptions } from '../mappers/configurable-options'
import { mapVariantToGallery } from '../mappers/gallery'
import { mapMetaSeo } from '../mappers/seo'
import { mapVariantsToShopin, mapVariantsToResponse } from '../mappers/variants'
import { ProductProjectionPagedQueryApiResponseSchema } from '../schemas/product-projection'
import type {
  Category,
  LocalizedString,
  ProductProjection,
  ProductProjectionPagedQueryResponse,
} from '@commercetools/platform-sdk'
import { buildCategoryPath, buildProductPath } from '@config/constants'

@Injectable()
export class ProductService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    private readonly languageProvider: RequestContext,
    @Optional() private readonly hooks?: MapperHooks
  ) {}

  /** The product page's product, with the shop's `product` hook applied after the built-in mapper. */
  async getProduct(
    productSlug: string,
    variantId?: string
  ): Promise<ProductResponse> {
    const { page, projection } = await this.mapProduct(productSlug, variantId)
    return this.hooks?.product
      ? { ...page, product: this.hooks.product(projection, page.product) }
      : page
  }

  private async mapProduct(
    productSlug: string,
    variantId?: string
  ): Promise<{ page: ProductResponse; projection: ProductProjection }> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)

    const response = await this.client
      .productProjections()
      .get({
        queryArgs: {
          where: `slug(${currentLanguage}="${productSlug}")`,
          staged: false,
          expand: [
            'productType',
            'categories[*]',
            'categories[*].ancestors[*]',
          ],
          limit: 1,
          priceCurrency: currency,
          priceCountry: country,
        },
      })
      .execute()

    const pagedResponse = ProductProjectionPagedQueryApiResponseSchema.parse(
      response.body
    )
    const product = pagedResponse.results[0]
    const projection = (response.body as ProductProjectionPagedQueryResponse)
      .results[0]!
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
    const slugMap = (product.slug ?? {}) as LocalizedStringApiResponse
    const slug = mapLocalized(slugMap, currentLanguage) || product.id
    const slugByLocale = Object.fromEntries(
      Object.entries(slugMap).filter(
        ([, value]) => typeof value === 'string' && value.length > 0
      )
    ) as Record<string, string>
    // One price for the price box and the badges, so they can never disagree.
    const price = mapVariantPriceToShopin(selectedVariant)
    const badges = mapBadges(
      price?.regularPriceInCents,
      price?.discountedPriceInCents,
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
      variantIdToImage,
      defsByName,
      currentLanguage
    )

    const page: ProductResponse = {
      product: {
        id: product.id,
        name,
        slug,
        slugByLocale,
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
        price,
        gallery: mapVariantToGallery(selectedVariant, name),
        badges,
        // deliveryEstimate is not available from commercetools by default
        configurableOptions,
        variants: mapVariantsToResponse(
          shopinVariants,
          defsByName,
          currentLanguage
        ),
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
        { label: name, path: buildProductPath(slug) },
      ],
      seo: mapMetaSeo(product, currentLanguage),
    }
    return { page, projection }
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
          path: buildCategoryPath(slug),
        },
      ]
    })
  }
}
