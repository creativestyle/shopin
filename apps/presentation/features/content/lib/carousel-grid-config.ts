import type { CarouselColumnsConfig } from '@/types/carousel'

/** Grid config for content carousels (teaser carousel, product carousel). */
export const CONTENT_CAROUSEL_GRID_CONFIG = {
  'base': 1,
  'sm': 2,
  'md': 3,
  'lg': 4,
  'xl': 4,
  '2xl': 4,
} satisfies Partial<CarouselColumnsConfig>

/** Number of initial items to preload; derived from max slides per view. */
export const CONTENT_CAROUSEL_PRELOAD_ITEM_COUNT = Math.max(
  ...(Object.values(CONTENT_CAROUSEL_GRID_CONFIG) as number[])
)
