import { TeaserProductCarouselBlock } from '@/features/content/teasers/teaser-product-carousel-block'
import type { ProductCarouselTeaser } from '@core/contracts/content/teaser-product-carousel'

export async function ProductCarouselWithMock({
  teaser,
}: {
  teaser: ProductCarouselTeaser
}) {
  return <TeaserProductCarouselBlock teaser={teaser} />
}
