# @integrations/commercetools-auth

NestJS module that handles customer authentication and registration via [Commercetools](https://commercetools.com/) for the SHOPin storefront accelerator. Provides login, registration, password reset, email verification, and anonymous sessions.

## Overview

This module implements the auth service interfaces consumed by the BFF. It uses the Commercetools Auth API through the shared server client of `@integrations/commercetools-core` (one client and token with the commerce package) and does not depend on the commerce package; the BFF uses it when `config/shop/shopin.config.ts` names it under `auth`. It pairs with `@integrations/commercetools-commerce`: sign-in uses the customers of the same project.

## Dependencies

This module depends on:

- `@integrations/commercetools-core` - The shared server-side client and the token client (`src/client/` wraps it)
- `@commercetools/platform-sdk` - Request types
- `@core/contracts` - For request/response schemas and types

## Usage

Import `commercetoolsAuth` from `@integrations/commercetools-auth/shopin` in `config/shop/shopin.config.ts` under `auth`,
next to `commercetools` under `commerce`, then `npm run setup`; or run `npm run use commerce commercetools auth commercetools`
(see the [root README](../../../README.md#quick-start)). The package exports only this descriptor: the BFF loads its
`auth` port at start and calls it through the port, never through the package's classes.

At start the port checks that the API client has the scopes sign-in needs (`manage_customers` besides the shopper
scopes); without them, `auth` is reported unavailable on `/bff/capabilities` and the rest of the shop runs.

## What the port does

- `signIn`, `signUp`, `signOut`, `refresh`: the identity of the `auth` port, against the project's customers.
- `accountFlows`: the account flows commercetools runs itself (password reset, email confirmation, anonymous session).

Errors reach the BFF as Nest exceptions: a wrong email or password is `401`, an email already in use is `409`.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
