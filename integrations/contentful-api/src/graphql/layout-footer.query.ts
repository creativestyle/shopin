import { gql } from 'graphql-request'
import { QUERY_LIMITS } from '../constants/query-limits'
import { LinkEntryFragment } from './link-entry.fragment'

/** Layout footer query. Uses Link fragment for footer/legal/social links. */
export const LayoutFooterQuery = gql`
  ${LinkEntryFragment}
  query LayoutFooter($locale: String!, $preview: Boolean!) {
    footerCollection(locale: $locale, limit: ${QUERY_LIMITS.LAYOUT_COLLECTION}, preview: $preview) {
      items {
        copyright
        footerLinksCollection(limit: ${QUERY_LIMITS.FOOTER_LINKS_GROUPS}) {
          items {
            title
            linksCollection(limit: ${QUERY_LIMITS.FOOTER_LINKS_PER_GROUP}) {
              items {
                ...LinkEntryFragment
                linkedPage {
                  slug
                }
              }
            }
          }
        }
        legalLinksCollection(limit: ${QUERY_LIMITS.FOOTER_LINKS_PER_GROUP}) {
          items {
            ...LinkEntryFragment
            linkedPage {
              slug
            }
          }
        }
        newsletterTitle
        newsletterDescription
        newsletterVoucherText
        newsletterDescriptionEnd
        newsletterSignUpLabel
        customerServiceTitle
        customerServicePhone
        customerServiceHours
        customerServiceContactUsLabel
        socialTitle
        socialLinksCollection(limit: ${QUERY_LIMITS.FOOTER_SOCIAL_LINKS}) {
          items {
            ...LinkEntryFragment
            linkedPage {
              slug
            }
          }
        }
        giftVoucherTitle
        giftVoucherLinkLabel
        giftVoucherLinkUrl
        paymentMethodsTitle
        paymentMethodsList
        shippingTitle
        shippingItemsList
        languageTitle
      }
    }
  }
`
