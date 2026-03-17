# @integrations/commercetools-auth

NestJS module that handles customer authentication and registration via [Commercetools](https://commercetools.com/) for the SHOPin storefront accelerator. Provides login, registration, password reset, email verification, and anonymous sessions.

## Overview

This module implements the auth service interfaces consumed by the BFF. It uses the Commercetools Auth API and works with `@integrations/commercetools-api`; the BFF uses it when the data source is `commercetools-set`.

## Dependencies

This module depends on:

- `@integrations/commercetools-api` - For the Commercetools API client
- `@core/contracts` - For request/response schemas and types

## Service Provider

The module includes `CommercetoolsAuthServiceProvider` that provides access to all Commercetools auth services through a unified interface.

## Usage

This module is used by the BFF (Backend for Frontend) service. It's imported and configured in `apps/bff/src/data-source/data-source.module.ts` and used by the `DataSourceFactory` to route auth requests to Commercetools.

### Using the Service Provider

```typescript
import type { CommercetoolsAuthServiceProvider } from '@integrations/commercetools-auth'

@Injectable()
export class YourService {
  constructor(
    @Inject('COMMERCETOOLS_AUTH_SERVICE_PROVIDER')
    private readonly authServiceProvider: CommercetoolsAuthServiceProvider
  ) {}

  async login(loginRequest: LoginRequest) {
    const { loginService } = this.authServiceProvider.getAuthServices()
    return loginService.login(loginRequest)
  }
}
```

### Using Individual Services

You can also inject individual services directly:

```typescript
import {
  CommercetoolsLoginService,
  CommercetoolsRegisterService,
} from '@integrations/commercetools-auth'

@Injectable()
export class YourService {
  constructor(
    private readonly loginService: CommercetoolsLoginService,
    private readonly registerService: CommercetoolsRegisterService
  ) {}
}
```

## Services

### CommercetoolsLoginService

- `login(loginRequest: LoginRequest): Promise<LoginResponse>` - Authenticates a user

### CommercetoolsRegisterService

- `register(registerRequest: RegisterRequest): Promise<RegisterResponse>` - Registers a new user

## Error Handling

The services throw appropriate NestJS exceptions:

- `UnauthorizedException` - When login credentials are invalid (thrown by `CommercetoolsLoginService`)
- `ConflictException` - When attempting to register with an existing email (thrown by `CommercetoolsRegisterService`)

## Integration

The module is automatically loaded by the BFF's `DataSourceModule` and provides auth services when the `commercetools-set` data source is selected. The `DataSourceFactory.getAuthServices()` method returns the appropriate auth services based on the configured data source.

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
