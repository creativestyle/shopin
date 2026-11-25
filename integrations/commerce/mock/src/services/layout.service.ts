import { Injectable } from '@nestjs/common'
import { getMockHeader } from './content/mock-header'
import { getMockFooter } from './content/mock-footer'

@Injectable()
export class LayoutService {
  async getHeader() {
    return getMockHeader()
  }

  async getFooter() {
    return getMockFooter()
  }
}
