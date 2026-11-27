import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { initRouteContext } from '@/lib/request-context/route-context'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { tryGetSiteBaseUrl } from '@/lib/site-url'
import { bffForPage, findShopPage } from '@/lib/shop-pages'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'

/** Paths with a file extension (e.g. .html, .json) are not CMS pages — 404. */
function hasFileExtension(slug: string): boolean {
  const lastSegment = slug.includes('/')
    ? slug.slice(slug.lastIndexOf('/') + 1)
    : slug
  return lastSegment.includes('.')
}

function getCmsSlug(pageSegments: string[] | undefined): string | null {
  const slug = pageSegments?.length ? pageSegments.join('/') : null
  if (!slug || hasFileExtension(slug)) {
    return null
  }
  return slug
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; page: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const { variant, locale, page } = await params
  initRouteContext({ variant, locale })
  // the shop's own page wins over a CMS page of the same path (as in the render): its own title and description
  const shopPage = findShopPage(page)
  if (shopPage) {
    const { Page } = shopPage
    if (Page.generateMetadata) {
      const { fetch } = await createBffFetchServer()
      return (await Page.generateMetadata({
        path: shopPage.path,
        searchParams: await searchParams,
        locale,
        bff: bffForPage(fetch),
      })) as Metadata
    }
    return (Page.metadata ?? {}) as Metadata
  }
  const cmsSlug = getCmsSlug(page)
  if (!cmsSlug) {
    return {}
  }

  try {
    const [pageData, baseUrl] = await Promise.all([
      getContentPage(cmsSlug),
      tryGetSiteBaseUrl(),
    ])
    return buildContentPageMetadata({
      pageData,
      localePrefix: locale,
      baseUrl,
    })
  } catch {
    return {}
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; page: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { variant, locale, page } = await params
  initRouteContext({ variant, locale })
  // the shop's own page (config/storefront, slot Pages) wins over a CMS page of the same path
  const shopPage = findShopPage(page)
  if (shopPage) {
    const { fetch } = await createBffFetchServer()
    return (
      <shopPage.Page
        path={shopPage.path}
        searchParams={await searchParams}
        locale={locale}
        bff={bffForPage(fetch)}
      />
    )
  }
  const cmsSlug = getCmsSlug(page)
  if (!cmsSlug) {
    notFound()
  }

  try {
    await getContentPage(cmsSlug)
  } catch {
    notFound()
  }

  return <ContentPage slug={cmsSlug} />
}
