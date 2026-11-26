import { Injectable } from '@nestjs/common'
import { getContentPageBySlug } from './content/mock-pages'

@Injectable()
export class PageService {
  async getPage(slug: string) {
    return getContentPageBySlug(slug)
  }
}
