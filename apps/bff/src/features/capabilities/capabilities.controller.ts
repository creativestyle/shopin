import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger'
import { Reads } from '@core/integration-kit'
import { CATEGORIES } from '@core/integration-kit/core'
import {
  currentProviders,
  unavailableDelegates,
  type Serving,
} from '../../data-source/providers'

/**
 * What this request's providers can do: the provider per category (the shop's own kinds included), the
 * categories none serves for this request (for example sign-in and accounts over mock commerce), per optional
 * commerce service whether the commerce provider offers it (`services.wishlist`), and the delegates that cannot
 * serve at all, with the reason (variables missing, credentials check failed at start).
 */
@ApiTags('capabilities')
@Reads()
@Controller('capabilities')
export class CapabilitiesController {
  @Get()
  @ApiOperation({
    summary:
      'Providers per category, unavailable categories and optional services',
  })
  @ApiOkResponse({
    description: 'Providers and unavailable categories with reasons',
  })
  getCapabilities(): Serving & {
    unavailableProviders: Record<string, Record<string, string>>
  } {
    const {
      providers: configured,
      unavailable: reasons,
      services,
    } = currentProviders()
    // no search integration: search is the commerce provider's own product search (the BFF's adapter)
    const own = configured.search !== undefined || reasons.search !== undefined
    const providers =
      own || !configured.commerce
        ? configured
        : { ...configured, search: configured.commerce }
    const unavailable =
      !own && reasons.commerce
        ? { search: reasons.commerce, ...reasons }
        : reasons
    const notConfigured = Object.fromEntries(
      CATEGORIES.filter((c) => !providers[c] && !unavailable[c]).map((c) => [
        c,
        'not configured',
      ])
    )
    return {
      providers,
      unavailable: { ...notConfigured, ...unavailable },
      services,
      unavailableProviders: Object.fromEntries(
        Object.entries(unavailableDelegates).filter(
          ([, ids]) => Object.keys(ids ?? {}).length
        )
      ) as Record<string, Record<string, string>>,
    }
  }
}
