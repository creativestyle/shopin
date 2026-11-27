/**
 * Connector fit, at boot: a commerce port and its descriptor must agree on the optional services it leaves out
 * (`omits`). (With the demo switch: its own tests, demo/switch-scenarios.)
 * Each case boots its own BFF in an isolated module registry.
 */
import { CORE_ENV, exactEnv, boot, request, useConfig, bff } from "./harness";

type Fixtures = typeof import("./fixtures");
type Kit = typeof import("@core/integration-kit");

describe("optional commerce services at boot", () => {
  it.each([
    [
      "the port has no wishlistService but its descriptor does not say so",
      { noWishlist: true },
      `"lax" has no wishlistService: list 'wishlist' in its omits`,
    ],
    [
      "the descriptor omits the wishlist but the port has one",
      { omits: ["wishlist"] as const },
      `"lax" lists 'wishlist' in omits but has a wishlistService`,
    ],
  ])("the BFF refuses to start when %s", async (_, given, message) => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require("./fixtures");
      const kit: Kit = require("@core/integration-kit");
      useConfig(() =>
        kit.defineConfig({
          commerce: fx.inMemoryCommerce({ id: "lax", ...given }),
        }),
      );
      exactEnv({ ...CORE_ENV });
      await expect(boot()).rejects.toThrow(message);
    });
  });
});
