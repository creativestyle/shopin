import {
  Injectable,
  ServiceUnavailableException,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { readsOf } from '@core/integration-kit/core'
import { currentProviders } from './providers'

/**
 * Every route, before its handler: a category the controller reads (`@Reads`) that is unavailable for this request
 * (its credentials check failed at start, or a delegate cannot serve) answers 503. The port of such a category stays
 * built (the BFF starts, `/bff/capabilities` says why), but no route reaches it, so no caller works with a provider
 * that is not there. The body says only which category: the reason's detail is in the start-up log.
 * A handler marked `@ServesWhileUnavailable()` is let through: it must work without the provider (sign-out).
 */
@Injectable()
export class ServingGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      this.reflector.get<boolean>(
        SERVES_WHILE_UNAVAILABLE,
        context.getHandler()
      )
    ) {
      return true
    }
    const { unavailable } = currentProviders()
    const down = (readsOf(context.getClass()) ?? []).filter(
      (category) => unavailable[category]
    )
    if (down.length) {
      throw new ServiceUnavailableException(`${down.join(', ')} unavailable`)
    }
    return true
  }
}

const SERVES_WHILE_UNAVAILABLE = 'shopin:serves-while-unavailable'

/**
 * Marks a handler that works while a category it reads is unavailable, so `ServingGuard` lets it through. Only for a
 * handler that never needs the provider to answer: sign-out clears SHOPin's session first and ignores the provider.
 */
export const ServesWhileUnavailable = () =>
  SetMetadata(SERVES_WHILE_UNAVAILABLE, true)
