// What the commercetools parts share (commerce, auth): the client, the token endpoint, the scopes, the guest
// session, the variables and the error helpers. No category, no port; it imports no part.
export * from './client/client.module'
export * from './client/user-client.service'
export * from './server-client.service'
export * from './shared/oauth-token.service'
export * from './shared/scopes'
export * from './shared/check-scopes'
export * from './shared/errors'
export * from './shared/guest-session.service'
export * from './env'
export * from './helpers/predicate'
export * from './is-duplicate-email-error'
