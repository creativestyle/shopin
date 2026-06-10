'use server'

import { listLocales, urlPrefixToRfc } from '@config/constants'
import { getProductPage } from '@/features/product/get-product-page'
import { getProductCollectionPage } from '@/features/productCollection/get-product-collection-page'
import { getContentPage } from '@/features/content/get-content-page'
import { isHomepageSlug } from '@/features/content/homepage-slug'
import { setRequestVariantFromSegment } from '@/lib/request-context/variant'

function stripLocalePrefix(path: string): string {
  for (const { urlPrefix } of listLocales()) {
    if (path === `/${urlPrefix}`) {
      return ''
    }
    if (path.startsWith(`/${urlPrefix}/`)) {
      return path.slice(urlPrefix.length + 1)
    }
  }
  return path
}

async function resolveTargetPath(
  rest: string,
  targetRfc: string
): Promise<string | null> {
  if (rest === '' || rest === '/') {
    return ''
  }

  if (rest.startsWith('/p/')) {
    const data = await getProductPage(rest.slice('/p/'.length))
    const slug = data.product.slugByLocale?.[targetRfc]
    return slug ? `/p/${slug}` : null
  }

  if (rest.startsWith('/c/')) {
    const data = await getProductCollectionPage(rest.slice('/c/'.length))
    const slug = data.slugByLocale?.[targetRfc]
    return slug ? `/c/${slug}` : null
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
  // Populate the per-request variant context so loaders hit the correct data
  // source. Without this, getRequestVariant() returns undefined here (we're
  // outside the [variant]/[locale] route tree) and the BFF would fall back to
  // the default data source, producing wrong localized slugs for alt-variant pages.
  if (variantSegment) {
    setRequestVariantFromSegment(variantSegment)
  }

  const rest = stripLocalePrefix(path)
  const targetRfc = urlPrefixToRfc(targetUrlPrefix)
  const fallback = `/${targetUrlPrefix}${rest}`

  try {
    const targetPath = await resolveTargetPath(rest, targetRfc)
    return targetPath !== null ? `/${targetUrlPrefix}${targetPath}` : fallback
  } catch {
    return fallback
  }
}
