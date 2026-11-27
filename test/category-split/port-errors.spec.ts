/**
 * A platform error the request caused (a page beyond the searchable range) reaches the shopper as a 4xx with a
 * fixed message, never as 500 and never with the platform's text: the integration says what its error means
 * (`errors` on its port), the BFF applies that to the services it calls.
 */
import { CORE_ENV, exactEnv, boot, request, useConfig, bff } from "./harness";

type Kit = typeof import("@core/integration-kit");

describe("platform errors through the BFF", () => {
  it("a request-caused platform error answers 400 with a fixed message", async () => {
    await jest.isolateModulesAsync(async () => {
      const kit: Kit = require("@core/integration-kit");
      const platform = kit.defineIntegration({
        id: "erring-shop",
        label: "erring-shop",
        description: "test fixture",
        omits: ["wishlist"],
        ports: {
          commerce: () =>
            kit.port("commerce", {
              useFactory: () =>
                ({
                  productService: {
                    getProduct: async () => {
                      throw Object.assign(
                        new Error(
                          "offset 20000 exceeds the maximum 10000 (internal detail)",
                        ),
                        { statusCode: 400 },
                      );
                    },
                  },
                }) as never,
              errors: (error) =>
                (error as { statusCode?: number }).statusCode === 400
                  ? { status: 400 }
                  : undefined,
            }),
        },
      });
      useConfig(() => kit.defineConfig({ commerce: platform }));
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      try {
        const { ProductService } = bff("features/product/product.service");
        const products = await (await request(app, {})).get(ProductService);
        const error = await products
          .getProductPage("beyond-range")
          .catch((e: unknown) => e);
        // (the BFF's own Nest module instance: compared by status, not by class)
        expect((error as { getStatus?: () => number }).getStatus?.()).toBe(400);
        expect((error as Error).message).toBe("The request cannot be served");
      } finally {
        await app.close();
      }
    });
  });
});
