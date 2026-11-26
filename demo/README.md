# Demo packages

⚠️ **DEMO ONLY**: the SHOPin demo on shopin.dev, all of it. A shop built on SHOPin uses none of it; deleting this
folder (then `npm run setup`) removes the demo, and nothing outside it names a package here.

| Package                      | Folder                 | What it is                                                                                           | Used by                                                   |
| ---------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `@demo/shop`                 | `shop`                 | The demo's config, the BFF side (as `config/shop`); no storefront package in its dependencies        | `npm run use demo`                                        |
| `@demo/storefront`           | `storefront`           | The demo's storefront slots, pages and texts (as `config/storefront`)                                | `npm run use demo`                                        |
| `@demo/provider-switch`      | `provider-switch`      | Per-request provider choice in the BFF ([README](provider-switch/README.md))                         | `providerSwitch({ … })` in `shop/config/shopin.config.ts` |
| `@demo/data-source-selector` | `data-source-selector` | The `/setup` page that switches providers ([README](data-source-selector/README.md))                 | `Pages.setup` in `storefront/src/storefront.mts`          |
| `@demo/demo-disclaimer`      | `demo-disclaimer`      | The "This is a demo shop" notice over every page except the legal ones                               | `SiteNotice` in `storefront/src/storefront.mts`           |
| `@demo/switch-scenarios`     | `switch-scenarios`     | The switch's tests in the real BFF (the framework's scenario harness)                                | `npm test`                                                |
| `@demo/mock-tracking-tags`   | `mock-tracking-tags`   | Fake analytics and marketing tags behind the cookie consent ([README](mock-tracking-tags/README.md)) | `TrackingTags` in `storefront/src/storefront.mts`         |

## On and off

- **Off (the default).** `config/shop/shopin.config.ts` and `config/storefront/storefront.mts` are the shop's own:
  no switch, the demo slots are `undefined`, and none of these packages is installed into `config/shop` or
  `config/storefront`, so none reaches a build.
- **On.** `npm run use demo` points the two files at `@demo/shop/config` and `@demo/storefront/storefront` (their
  own lines kept as comments) and runs setup; `npm run use demo off` restores them. Root README, "The SHOPin demo".

## Removing the demo from a shop's repository

`npm run use demo off` (if it is on), then `npm run use demo remove`: it deletes this folder and runs setup. Details in
the root README, "Removing the demo" (it stays when this folder goes).

## License

OSL-3.0, see the [root LICENSE](../LICENSE).
