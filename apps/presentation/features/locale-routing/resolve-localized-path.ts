'use server'

import { cookies } from 'next/headers'
import { listLocales, urlPrefixToRfc } from '@config/constants'
import { isPreviewTokenValid, PREVIEW_TOKEN_COOKIE } from '@/lib/draft-mode'
import { getProductPage } from '@/features/product/get-product-page'
import { getProductCollectionPage } from '@/features/productCollection/get-product-collection-page'
import { getContentPage } from '@/features/content/get-content-page'
import { isHomepageSlug } from '@/features/content/homepage-slug'
import { runWithRequestVariantFromSegment } from '@/lib/request-context/variant'
import { isVariantSegment } from '@/lib/variant/variant-key'

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

const PREVIEW_PREFIX = '/preview'

function stripPreviewPrefix(rest: string): string | null {
  if (rest === PREVIEW_PREFIX || rest.startsWith(`${PREVIEW_PREFIX}/`)) {
    return rest.slice(PREVIEW_PREFIX.length)
  }
  return null
}

async function hasValidPreviewCookie(): Promise<boolean> {
  return isPreviewTokenValid((await cookies()).get(PREVIEW_TOKEN_COOKIE)?.value)
}

async function resolveTargetPath(
  rest: string,
  targetRfc: string,
  isDraft: boolean
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

  const data = await getContentPage(rest.slice(1), isDraft)
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
  const localeRest = stripLocalePrefix(path)
  // Explicit /preview URLs: resolve the slug without the segment, then re-add it
  const previewRest = stripPreviewPrefix(localeRest)
  const isPreview = previewRest !== null
  const rest = previewRest ?? localeRest
  const prefix = `/${targetUrlPrefix}${isPreview ? PREVIEW_PREFIX : ''}`
  const targetRfc = urlPrefixToRfc(targetUrlPrefix)
  const fallback = `${prefix}${rest}`

  if (variantSegment !== null && !isVariantSegment(variantSegment)) {
    return fallback
  }

  const resolve = async () => {
    try {
      const isDraft = isPreview && (await hasValidPreviewCookie())
      const targetPath = await resolveTargetPath(rest, targetRfc, isDraft)
      return targetPath !== null ? `${prefix}${targetPath}` : fallback
    } catch {
      return fallback
    }
  }

  return variantSegment
    ? runWithRequestVariantFromSegment(variantSegment, resolve)
    : resolve()
}
