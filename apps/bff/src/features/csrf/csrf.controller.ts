import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOkResponse } from '@nestjs/swagger'
import { CsrfTokenService } from './csrf-token.service'

@ApiTags('csrf')
@Controller('csrf')
export class CsrfController {
  constructor(private readonly csrfTokenService: CsrfTokenService) {}

  @Get('token')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'CSRF token retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
    },
  })
  async getCsrfToken(): Promise<{ token: string }> {
    const token = await this.csrfTokenService.generateToken()
    this.csrfTokenService.setTokenCookie(token)
    return { token }
  }
}
