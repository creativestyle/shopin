import type { ContentPageResponse } from '@core/contracts/content/page'
import { placeholderImage } from './base'
import { getHomepage } from './homepage'
import { getAboutPage } from './about'
import { getSupportPage } from './support'
import { getDefaultPage } from './default-page'

export function getContentPageBySlug(slug: string): ContentPageResponse {
  const placeholder = placeholderImage
  switch (slug) {
    case 'homepage':
      return getHomepage(placeholder)
    case 'about':
      return getAboutPage(placeholder)
    case 'support':
      return getSupportPage()
    default:
      return getDefaultPage(slug, placeholder)
  }
}
