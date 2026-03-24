import type { CarouselColumnsConfig } from '@/types/carousel'

/** Grid config for brand teaser */
export const BRAND_CAROUSEL_GRID_CONFIG = {
  'base': 2,
  'sm': 2,
  'md': 4,
  'lg': 6,
  'xl': 8,
  '2xl': 8,
} satisfies Partial<CarouselColumnsConfig>

/** Number of initial items to preload; derived from max slides per view. */
export const BRAND_CAROUSEL_PRELOAD_ITEM_COUNT = Math.max(
  ...(Object.values(BRAND_CAROUSEL_GRID_CONFIG) as number[])
)
