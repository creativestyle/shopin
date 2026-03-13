import { verifyDraftToken } from '@core/draft-token'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { DRAFT_MODE_HEADER } from '@config/constants'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
} as const

@Injectable()
export class DraftModeService {
  constructor(private readonly config: ConfigService) {}

  isDraftModeRequest(req: Request): boolean {
    try {
      const secret = this.config.get<string>('NEXT_DRAFT_MODE_SECRET')?.trim()
      const value = String(req.headers[DRAFT_MODE_HEADER] ?? '').trim()
      return Boolean(secret && value && verifyDraftToken(value, secret))
    } catch {
      return false
    }
  }

  applyNoCacheIfPreview(res: Response | undefined, usePreview: boolean): void {
    if (usePreview && res) {
      res.setHeader('Cache-Control', NO_CACHE_HEADERS['Cache-Control'])
      res.setHeader('Pragma', NO_CACHE_HEADERS.Pragma)
    }
  }
}
