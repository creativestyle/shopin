/**
 * Shared query limits for Contentful GraphQL API.
 *
 * Use these constants everywhere collection limits are applied so that:
 * - All limits are managed in one place.
 * - Changes are visible in a single diff and can be reviewed for impact.
 *
 * CTF (Contentful) constraints:
 * - Query complexity: responses can fail if the total cost exceeds the space limit (e.g. 11000).
 *   Lower limits reduce complexity; raising them can trigger "query too complex" errors.
 * - Request body size: GraphQL request body is minified to fit within the 8192-byte limit.
 */
export const QUERY_LIMITS = {
  /** Page by slug: single page fetch. */
  PAGE_COLLECTION: 1,
  /** Max components (teasers) per page. */
  COMPONENTS_PER_PAGE: 20,

  /** Teaser section: subcategory link entries. */
  SECTION_SUBCATEGORY_LINKS: 20,
  /** Teaser slider: slides. */
  SLIDER_SLIDES: 30,
  /** Teaser carousel: carousel items. */
  CAROUSEL_ITEMS: 30,
  /** Teaser accordion: accordion items. */
  ACCORDION_ITEMS: 30,
  /** Teaser brand: brand items. */
  BRAND_ITEMS: 20,

  /** Layout: single footer / single top bar. */
  LAYOUT_COLLECTION: 1,
  /** Footer: footer link groups. */
  FOOTER_LINKS_GROUPS: 10,
  /** Footer: links per group (footer links, legal, social). */
  FOOTER_LINKS_PER_GROUP: 20,
  /** Footer: social links (often fewer). */
  FOOTER_SOCIAL_LINKS: 10,
} as const

export type QueryLimits = typeof QUERY_LIMITS
