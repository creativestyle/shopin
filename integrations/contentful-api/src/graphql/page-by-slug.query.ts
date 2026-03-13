import { gql } from 'graphql-request'
import { I18N_CONFIG } from '@config/constants'
import { QUERY_LIMITS } from '../constants/query-limits'
import { LinkEntryFragment } from './link-entry.fragment'
import { ButtonEntryFragment } from './button-entry.fragment'
import { TeaserBannerFragment } from './teaser-banner.fragment'
import { TeaserHeroFragment } from './teaser-hero.fragment'
import { TeaserHeadlineFragment } from './teaser-headline.fragment'
import { TeaserImageFragment } from './teaser-image.fragment'
import { TeaserTextFragment } from './teaser-text.fragment'
import { TeaserRichTextFragment } from './teaser-rich-text.fragment'
import { TeaserCarouselFragment } from './teaser-carousel.fragment'
import { TeaserSliderFragment } from './teaser-slider.fragment'
import { TeaserProductCarouselFragment } from './teaser-product-carousel.fragment'
import { TeaserSectionFragment } from './teaser-section.fragment'
import { TeaserRegularFragment } from './teaser-regular.fragment'
import { TeaserAccordionFragment } from './teaser-accordion.fragment'
import { TeaserCarouselItemFragment } from './teaser-carousel-item.fragment'
import { AssetFragment } from './asset.fragment'

/** Page by slug query; composes all teaser fragments. Each fragment defined once. */
export const PageBySlugQuery = gql`
  ${AssetFragment}
  ${LinkEntryFragment}
  ${ButtonEntryFragment}
  ${TeaserCarouselItemFragment}
  ${TeaserBannerFragment}
  ${TeaserHeroFragment}
  ${TeaserHeadlineFragment}
  ${TeaserImageFragment}
  ${TeaserTextFragment}
  ${TeaserRichTextFragment}
  ${TeaserCarouselFragment}
  ${TeaserSliderFragment}
  ${TeaserProductCarouselFragment}
  ${TeaserSectionFragment}
  ${TeaserRegularFragment}
  ${TeaserAccordionFragment}
  query PageBySlug($slug: String!, $locale: String!, $preview: Boolean!) {
    pageCollection(
      where: { slug: $slug }
      locale: $locale
      limit: ${QUERY_LIMITS.PAGE_COLLECTION}
      preview: $preview
    ) {
      items {
        slug
        ${I18N_CONFIG.supportedLanguages
          .map(
            (locale) =>
              `slug_${locale.replace(/-/g, '_')}: slug(locale: "${locale}")`
          )
          .join('\n        ')}
        pageTitle
        pageTitleVisibility
        parentPage {
          slug
          pageTitle
          parentPage {
            slug
            pageTitle
            parentPage {
              slug
              pageTitle
              parentPage {
                slug
                pageTitle
                parentPage {
                  slug
                  pageTitle
                }
              }
            }
          }
        }
        metaTitle
        metaDescription
        ogImage {
          ...AssetFragment
        }
        noIndex
        componentsCollection(limit: ${QUERY_LIMITS.COMPONENTS_PER_PAGE}) {
          items {
            __typename
            ...TeaserBannerFragment
            ...TeaserHeroFragment
            ...TeaserHeadlineFragment
            ...TeaserImageFragment
            ...TeaserTextFragment
            ...TeaserRichTextFragment
            ...TeaserCarouselFragment
            ...TeaserSliderFragment
            ...TeaserProductCarouselFragment
            ...TeaserSectionFragment
            ...TeaserRegularFragment
            ...TeaserAccordionFragment
          }
        }
      }
    }
  }
`
