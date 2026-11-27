/**
 * The shop's real config (config/shop, `@shopin/config`; no mock of it here), booted as the BFF runs it: the BFF
 * starts with the core's variables only and `/bff/capabilities` answers over HTTP, every configured category served
 * by an integration and none unavailable, the others "not configured". (The demo's config: demo/switch-scenarios.)
 */
import type { ShopinConfig } from "@core/integration-kit/core";
import { CORE_ENV, exactEnv, boot, http } from "./harness";

describe("config/shop boots", () => {
  it("/bff/capabilities: every configured category is served, the rest is not configured", async () => {
    const { config } = require("@shopin/config") as { config: ShopinConfig };
    const { CATEGORIES, categoriesOf } = require("@core/integration-kit/core");
    exactEnv({ ...CORE_ENV });
    const server = await http(await boot());
    try {
      const { status, body } = await server.fetch("/bff/capabilities");
      expect(status).toBe(200);
      const configured: string[] = categoriesOf(config);
      expect(configured).toContain("commerce");
      for (const category of configured) {
        expect({ category, provider: body.providers[category] }).toEqual({
          category,
          provider: expect.any(String),
        });
        expect({ category, reason: body.unavailable[category] }).toEqual({
          category,
          reason: undefined,
        });
      }
      // no search integration: the commerce integration's own product search serves it
      if (!configured.includes("search")) {
        expect(body.providers.search).toBe(body.providers.commerce);
      }
      for (const category of CATEGORIES as string[]) {
        if (!configured.includes(category) && category !== "search") {
          expect({ category, reason: body.unavailable[category] }).toEqual({
            category,
            reason: "not configured",
          });
        }
      }
      expect(body.unavailableProviders).toEqual({});
      // the deployment's check reads this answer and passes it (scripts/checks/bff-capabilities.mjs)
      const script = "../../scripts/checks/bff-capabilities.mjs";
      const { checkCapabilities } = (await import(script)) as {
        checkCapabilities: (
          base: string,
        ) => Promise<{ served: object; problems: string[] }>;
      };
      expect(await checkCapabilities(server.base)).toEqual({
        served: body.providers,
        problems: [],
      });
    } finally {
      await server.close();
    }
  });
});
