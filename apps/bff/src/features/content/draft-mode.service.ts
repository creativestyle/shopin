import { verifyDraftToken } from '@core/draft-token'
import { Injectable } from '@nestjs/common'
import { coreSecret } from '../../common/env/env-file'
import type { Request, Response } from 'express'
import {
  DRAFT_MODE_HEADER,
  DRAFT_HEADER_TOKEN_MAX_AGE_SEC,
} from '@config/constants'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
} as const

@Injectable()
export class DraftModeService {
  isDraftModeRequest(req: Request): boolean {
    try {
      const secret = coreSecret('NEXT_DRAFT_MODE_SECRET')?.trim()
      const value = String(req.headers[DRAFT_MODE_HEADER] ?? '').trim()
      return Boolean(
        secret &&
        value &&
        verifyDraftToken(value, secret, DRAFT_HEADER_TOKEN_MAX_AGE_SEC)
      )
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
