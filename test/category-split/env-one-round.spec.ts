/**
 * One round of variables: what setup lists (the kit's `requiredEnv`, conditional variables included) is exactly what
 * the BFF asks for. A commerce fixture declares a variable only some shops need per locale and one only needed when
 * sign-in is another integration's; the BFF boots with exactly the listed variables and names the conditional ones,
 * with why, in its first message when they are missing.
 */
import { CORE_ENV, exactEnv, boot, useConfig } from "./harness";

type Fixtures = typeof import("./fixtures");
type Kit = typeof import("@core/integration-kit");
type Core = typeof import("@core/integration-kit/core");

/** The shop config: commerce with conditional variables, sign-in through another integration. */
function shop(fx: Fixtures, kit: Kit) {
  const commerce = fx.inMemoryCommerce({
    id: "remote",
    customers: true,
    env: {
      commerce: {
        key: { env: "REMOTE_KEY" },
        stores: {
          env: "REMOTE_STORES",
          optional: true,
          requiredWhen: ({ locales }) =>
            locales.length > 1
              ? `a store per locale (${locales.join(", ")})`
              : undefined,
        },
        link: {
          env: "REMOTE_LINK_CUSTOMERS",
          optional: true,
          requiredWhen: ({ providers }) =>
            providers.auth?.some((id) => id !== "remote")
              ? "sign-in through another provider links customers: set it to 1"
              : undefined,
        },
      },
    },
  });
  const idp = fx.fakeIdp({
    id: "idp",
    env: { auth: { issuer: { env: "IDP_ISSUER" } } },
  });
  return kit.defineConfig({ commerce, auth: idp });
}

/** What setup writes into .env for this config: every listed variable, filled in. */
function listed(core: Core, config: ReturnType<typeof shop>) {
  const { I18N_CONFIG } = require("@config/constants");
  const { required } = core.requiredEnv(config, I18N_CONFIG.supportedLocales);
  return Object.fromEntries(
    Object.values(required)
      .flat()
      .map((name) => [name, "1"]),
  );
}

describe("variables: one round", () => {
  it("setup lists the conditional variables with the others, and the BFF boots with exactly those", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      const core: Core = require("@core/integration-kit/core");
      const config = shop(fx, kit);
      const vars = listed(core, config);
      expect(Object.keys(vars).sort()).toEqual(
        [
          "IDP_ISSUER",
          "REMOTE_KEY",
          "REMOTE_LINK_CUSTOMERS",
          "REMOTE_STORES",
        ].sort(),
      );
      useConfig(() => config as never);
      exactEnv({ ...CORE_ENV, ...vars });
      const app = await boot();
      await app.close();
    });
  });

  it("without them the BFF's first message names every one, the conditional ones with why", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      useConfig(() => shop(fx, kit) as never);
      exactEnv({ ...CORE_ENV });
      const error = await boot().catch((e: Error) => e);
      expect(String(error)).toMatch(
        /remote: REMOTE_KEY, REMOTE_STORES, REMOTE_LINK_CUSTOMERS/,
      );
      expect(String(error)).toMatch(
        /REMOTE_LINK_CUSTOMERS: sign-in through another provider/,
      );
      expect(String(error)).toMatch(/idp: IDP_ISSUER/);
    });
  });
});
