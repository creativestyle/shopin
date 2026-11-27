/**
 * #345 criterion 11: SHOPin's session cookie and every vault cookie (the provider tokens, sealed per port) are
 * HttpOnly and Secure, as every BFF write sets them (cookie.service.ts, session-check.middleware.ts): the browser's
 * scripts read no provider token, and the session never travels over plain HTTP.
 */
import {
  CORE_ENV,
  exactEnv,
  boot,
  request,
  useConfig,
  bff,
  type Jar,
} from "./harness";

describe("the session cookie and the vault cookies", () => {
  it("are HttpOnly and Secure: the browser can read no provider token and the session never travels unencrypted", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: typeof import("./fixtures") = require("./fixtures");
      const kit: typeof import("@core/integration-kit") = require("@core/integration-kit");
      // the platform's own sign-in: a guest vault entry first, then the customer's commerce session kept in the vault
      const remote = fx.inMemoryCommerce({
        id: "remote",
        guestSession: true,
        customers: true,
        attach: true,
      });
      const own = fx.fakeIdp({
        id: "remote",
        requires: {
          auth: {
            needs: { commerce: "remote" },
            reason: "signs in the customers of remote only",
          },
        },
        commerceSession: {
          accessToken: "customer-access-token",
          refreshToken: "customer-refresh-token",
          expiresIn: 3600,
        },
      });
      useConfig(() => kit.defineConfig({ commerce: remote, auth: own }));
      exactEnv({ ...CORE_ENV });
      const app = await boot();
      try {
        const jar: Jar = {};
        const set: Record<string, Record<string, unknown>> = {};
        const guest = await request(app, jar);
        await (
          await guest.get(bff("features/cart/cart.service").CartService)
        ).createCart();
        Object.assign(set, guest.cookieOptions);
        const signIn = await request(app, jar);
        await (
          await signIn.get(bff("features/auth/auth.service").AuthService)
        ).login({ email: "alice@example.com", password: fx.IDP_PASSWORD });
        for (const [name, options] of Object.entries(signIn.cookieOptions))
          set[`${name} (sign-in)`] = options;
        const names = Object.keys(set).filter(
          (n) => n.startsWith("shopin-session") || n.startsWith("vault."),
        );
        // a guest entry, the session and the customer's entry were all written
        expect(names).toEqual(
          expect.arrayContaining([
            "vault.commerce.remote",
            "shopin-session (sign-in)",
            "vault.commerce.remote (sign-in)",
          ]),
        );
        for (const name of names)
          expect({
            name,
            httpOnly: set[name]!.httpOnly,
            secure: set[name]!.secure,
          }).toEqual({
            name,
            httpOnly: true,
            secure: true,
          });
      } finally {
        await app.close();
      }
    });
  });
});
