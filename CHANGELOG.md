# Changelog

## Unreleased

### Integrations in the vendor layout ("Switch")

Upgrade notes for a deployed shop:

- **Shoppers are signed out once.** The BFF's session has a new format (one encrypted session cookie holding the
  identity and its customer links; cart ids are kept in that session). At the deploy that brings it, the old cookies
  are no longer read: every signed-in shopper is signed out once and signs in again, and a cart held only in the
  old cookies is not picked up. Nothing else is needed; it happens once.
- **Production needs `BFF_SESSION_REVOCATIONS_FILE`.** Logout and password changes are now remembered server-side
  in this file. Set it to a path on persistent storage before deploying; with several BFF instances, a file on
  storage they share (on Upsun a network storage mount). In production the BFF does not start without it, nor when
  the file's folder is not writable. Details: `apps/bff/README.md`.
