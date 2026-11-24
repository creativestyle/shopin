'use server'

import {
  buildCategoryPath,
  buildProductPath,
  getCategorySlugFromPath,
  getProductSlugFromPath,
  stripLocalePrefix,
  urlPrefixToRfc,
} from '@config/constants'
import { getProductPage } from '@/features/product/get-product-page'
import { getProductCollectionPage } from '@/features/productCollection/get-product-collection-page'
import { getContentPage } from '@/features/content/get-content-page'
import { isHomepageSlug } from '@/features/content/homepage-slug'
import { runWithRequestVariantFromSegment } from '@/lib/request-context/variant'
import { isVariantSegment } from '@/lib/variant/variant-key'

async function resolveTargetPath(
  rest: string,
  targetRfc: string
): Promise<string | null> {
  if (rest === '' || rest === '/') {
    return ''
  }

  const productSlug = getProductSlugFromPath(rest)
  if (productSlug !== null) {
    const data = await getProductPage(productSlug)
    const slug = data.product.slugByLocale?.[targetRfc]
    return slug ? buildProductPath(slug) : null
  }

  const categorySlug = getCategorySlugFromPath(rest)
  if (categorySlug !== null) {
    const data = await getProductCollectionPage(categorySlug)
    const slug = data.slugByLocale?.[targetRfc]
    return slug ? buildCategoryPath(slug) : null
  }

  const data = await getContentPage(rest.slice(1))
  const slug = data.slugByLocale?.[targetRfc]
  if (!slug) {
    return null
  }
  return isHomepageSlug(slug) ? '' : `/${slug}`
}

export async function resolveLocalizedPath({
  path,
  targetUrlPrefix,
  variantSegment,
}: {
  path: string
  targetUrlPrefix: string
  variantSegment: string | null
}): Promise<string> {
  const rest = stripLocalePrefix(path)
  const targetRfc = urlPrefixToRfc(targetUrlPrefix)
  const fallback = `/${targetUrlPrefix}${rest}`

  if (variantSegment !== null && !isVariantSegment(variantSegment)) {
    return fallback
  }

  const resolve = async () => {
    try {
      const targetPath = await resolveTargetPath(rest, targetRfc)
      return targetPath !== null ? `/${targetUrlPrefix}${targetPath}` : fallback
    } catch {
      return fallback
    }
  }

  return variantSegment
    ? runWithRequestVariantFromSegment(variantSegment, resolve)
    : resolve()
}
