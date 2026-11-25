# @integrations/commercetools-core

What the commercetools parts ([commerce](../commerce/README.md), [auth](../auth/README.md)) share. It has no category and no port of its own, and it imports none of the parts.

- `CommercetoolsCoreModule`: provides `ServerClientService`, the server-side commercetools client (client-credentials flow). Every part imports this module, so they share one client and one token.
- `createTokenClient`: a client that acts with an access token the caller already has (a customer's or an anonymous session's).
- `isDuplicateEmailError`: tells a commercetools "email already taken" error (`DuplicateField` on `email`) from other errors.
- `Client`: the commercetools API builder type.

## Environment Variables

Env are set in the **repo root `.env`**. See [root `.env.example`](../../../.env.example). This package reads `COMMERCETOOLS_CLIENT_ID`, `COMMERCETOOLS_CLIENT_SECRET`, `COMMERCETOOLS_PROJECT_KEY`, `COMMERCETOOLS_API_URL` and `COMMERCETOOLS_AUTH_URL`.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
