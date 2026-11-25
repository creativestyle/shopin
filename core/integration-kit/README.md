# @core/integration-kit

The typed contract between a shop's config, its integrations and the BFF: how an integration declares what it
serves, and how a shop chooses integrations in one config.

> **Status:** the BFF does not load ports through this kit yet. It still wires integrations in
> `apps/bff/src/data-source/`; the kit is the API it moves onto.

## Entry points

| Import                          | For                        | What it holds                                                                                                                                                                  |
| ------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@core/integration-kit`         | integration authors, shops | `defineIntegration`, `port`, `defineConfig`, the port types, and the injectables a port receives: `PortOptions`, `RequestContext`, `TokenVault`, `CustomerContext`             |
| `@core/integration-kit/testing` | integration authors        | `commerceContract` (the commerce contract suite), `buildPort` (builds a port as the BFF does; needs `@nestjs/testing`) and `recordedFetch` (replays recorded vendor responses) |
| `@core/integration-kit/core`    | the framework              | `loadPorts`, `requiredEnv`, `validateConfig`, `storefrontData`. Its types are exported only under the `shopin-framework` export condition: not an API for integrations         |

## Extending

- **A kind of port of your own:** add it once in your descriptor's types, which also makes it a config key:
  `declare module '@core/integration-kit' { interface ServingPorts { orderRules?: OrderRules } }`.
- **Your own fields on a contract:** `defineConfig({ contracts: { cart: CartResponseSchema.extend({ … }) } })`. The
  BFF parses that contract with the extension; every integration that fills it needs its mapper hook.
- **Your own BFF feature modules:** `defineConfig({ features: [CompanyRegisterModule] })`, mounted when the
  categories their controllers read (`@Reads`) are served.

## Scripts

- `npm run build`: compiles to `dist/`.
- `npm run test`: builds, then runs `test/*.test.mjs` with `node --test` against `dist/`.
- `npm run check-types`: the sources and the type tests in `test/types.ts`.

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
