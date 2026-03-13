/**
 * Content type IDs: one list for reset (delete order), one for page components.
 */

const TEASERS = [
  'teaserBanner',
  'teaserHero',
  'teaserHeadline',
  'teaserImage',
  'teaserText',
  'teaserRichText',
  'teaserCarousel',
  'teaserSlider',
  'teaserProductCarousel',
  'teaserSection',
  'teaserRegular',
  'teaserAccordion',
]

/** All content types in dependency-safe order. Reset deletes entries then content types in this order. */
export const CONTENT_TYPE_IDS = [
  'topBar',
  'footer',
  'page',
  'footerSection',
  ...TEASERS,
  'teaserCarouselItem',
  'accordion',
  'accordionItem',
  'button',
  'link',
  'richText',
]

/** Content type IDs allowed as page components (teasers only; accordion, button, richText are used inside teasers). */
export const PAGE_COMPONENT_IDS = [...TEASERS]
