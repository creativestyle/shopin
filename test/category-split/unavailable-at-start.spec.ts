/**
 * Credentials at start, one rule for every category and vendor: a provider whose credentials check (`probe`) fails
 * (an unreachable host, a refused key) is unavailable with the reason, and the BFF starts (commerce too: no bare
 * start-up failure). A missing variable still stops the start, naming it. (A port serving through others passes
 * such a provider over: that integration's own tests.)
 */
import { CORE_ENV, exactEnv, boot, request, useConfig, bff } from "./harness";

type Fixtures = typeof import("./fixtures");
type Kit = typeof import("@core/integration-kit");

/** An integration whose port's credentials check fails (as a wrong token would). */
const failing = (
  kit: Kit,
  id: string,
  category: "cms" | "commerce",
  message = "401 Unauthorized",
) =>
  kit.defineIntegration({
    id,
    omits: ["wishlist"],
    ports: {
      [category]: () =>
        kit.port(category, {
          useFactory: () => ({}) as never,
          probe: async () => {
            throw new Error(message);
          },
        }),
    } as never,
  });

describe("credentials at start", () => {
  it("a commerce provider whose credentials check fails is unavailable with the reason; the BFF starts", async () => {
    await jest.isolateModulesAsync(async () => {
      const kit: Kit = require("@core/integration-kit");
      useConfig(() =>
        kit.defineConfig({
          commerce: failing(
            kit,
            "broken-shop",
            "commerce",
            "auth.example.test cannot be reached (FX_AUTH_URL): ENOTFOUND",
          ),
        }),
      );
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      try {
        const { CapabilitiesController } = bff(
          "features/capabilities/capabilities.controller",
        );
        const capabilities = (
          await (await request(app, {})).get(CapabilitiesController)
        ).getCapabilities();
        expect(capabilities.unavailable.commerce).toBe(
          "its credentials check failed (auth.example.test cannot be reached (FX_AUTH_URL): ENOTFOUND)",
        );
      } finally {
        await app.close();
      }
    });
  });

  it("one instance serving several categories: its failed check makes each of them unavailable, with the same reason", async () => {
    await jest.isolateModulesAsync(async () => {
      const kit: Kit = require("@core/integration-kit");
      const fx: Fixtures = require("./fixtures");
      // commerce checks its credentials; search, the same platform, has no check of its own
      const platform = kit.defineIntegration({
        id: "one-platform",
        omits: ["wishlist"],
        ports: {
          commerce: () =>
            kit.port("commerce", {
              useFactory: () => ({}) as never,
              probe: async () => {
                throw new Error(
                  "platform.example.test cannot be reached (FX_URL): ENOTFOUND",
                );
              },
            }),
          search: () => kit.port("search", { useFactory: () => ({}) as never }),
        },
      });
      useConfig(() =>
        kit.defineConfig({
          commerce: platform,
          search: platform,
          cms: fx.contentOnly({ id: "local-cms", serves: ["cms"] }),
        }),
      );
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      try {
        const { CapabilitiesController } = bff(
          "features/capabilities/capabilities.controller",
        );
        const { unavailable, providers } = (
          await (await request(app, {})).get(CapabilitiesController)
        ).getCapabilities();
        const reason =
          "its credentials check failed (platform.example.test cannot be reached (FX_URL): ENOTFOUND)";
        expect(unavailable.commerce).toBe(reason);
        expect(unavailable.search).toBe(reason);
        expect(providers.cms).toBe("local-cms");
      } finally {
        await app.close();
      }
    });
  });

  it("its own sign-in too: the BFF starts with commerce and auth unavailable (no customer linking to check)", async () => {
    await jest.isolateModulesAsync(async () => {
      const kit: Kit = require("@core/integration-kit");
      const platform = kit.defineIntegration({
        id: "one-platform",
        omits: ["wishlist"],
        requires: {
          auth: {
            needs: { commerce: "one-platform" },
            reason: "its own customers",
          },
        },
        ports: {
          commerce: () =>
            kit.port("commerce", {
              useFactory: () => ({}) as never,
              probe: async () => {
                throw new Error(
                  "platform.example.test cannot be reached (FX_URL): ENOTFOUND",
                );
              },
            }),
          auth: () => kit.port("auth", { useFactory: () => ({}) as never }),
        },
      });
      useConfig(() => kit.defineConfig({ commerce: platform, auth: platform }));
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      try {
        const { CapabilitiesController } = bff(
          "features/capabilities/capabilities.controller",
        );
        const { unavailable } = (
          await (await request(app, {})).get(CapabilitiesController)
        ).getCapabilities();
        expect(unavailable.auth).toBe(unavailable.commerce);
        expect(unavailable.auth).toMatch(/credentials check failed/);
      } finally {
        await app.close();
      }
    });
  });

  it("a vendor's sign-in part failing its own check (missing scope) leaves its commerce part serving", async () => {
    await jest.isolateModulesAsync(async () => {
      const kit: Kit = require("@core/integration-kit");
      const platform = kit.defineIntegration({
        id: "one-platform",
        omits: ["wishlist"],
        requires: {
          auth: {
            needs: { commerce: "one-platform" },
            reason: "its own customers",
          },
        },
        ports: {
          commerce: () =>
            kit.port("commerce", {
              useFactory: () => ({}) as never,
              probe: async () => {},
            }),
          auth: () =>
            kit.port("auth", {
              useFactory: () => ({}) as never,
              probe: async () => {
                throw new Error(
                  "the API client lacks the scopes: manage_customers",
                );
              },
            }),
        },
      });
      useConfig(() => kit.defineConfig({ commerce: platform, auth: platform }));
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      try {
        const { CapabilitiesController } = bff(
          "features/capabilities/capabilities.controller",
        );
        const { unavailable, providers } = (
          await (await request(app, {})).get(CapabilitiesController)
        ).getCapabilities();
        expect(unavailable.auth).toMatch(/lacks the scopes: manage_customers/);
        expect(unavailable.commerce).toBeUndefined();
        expect(providers.commerce).toBe("one-platform");
      } finally {
        await app.close();
      }
    });
  });

  it("a missing variable still stops the start", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      useConfig(() =>
        kit.defineConfig({
          commerce: fx.inMemoryCommerce({ id: "local" }),
          cms: fx.contentOnly({
            id: "keyed-cms",
            serves: ["cms"],
            env: { cms: { token: { env: "KEYED_CMS_TOKEN" } } },
          }),
        }),
      );
      exactEnv({ ...CORE_ENV });
      await expect(boot()).rejects.toThrow(/keyed-cms: KEYED_CMS_TOKEN/);
    });
  });
});
