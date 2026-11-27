/**
 * The one hand-over between sign-in and commerce (#345 criterion 23, D-84), decided by one rule (`isOwnSignIn`): the
 * sign-in is the commerce platform's own when one provider serves auth and commerce and its descriptor requires this
 * commerce (`requires: { auth: { needs: { commerce } } }`). Only that sign-in
 * - is handed the guest's commerce token,
 * - has the commerce session it returns kept in the commerce vault entry,
 * - signs in with the customer id as subject (no linking),
 * - merges the guest cart itself (the BFF asks for its active cart before any take-over through `attachGuestCart`),
 * - has its session end when that commerce session is gone.
 * Every other sign-in is identity only, linked through the commerce port's `customers`: an external identity provider
 * (the stand-in for Auth0), one whose descriptor only lets it pair with this commerce under another id (like the mock
 * identity over mock commerce), and a part with the commerce provider's id whose descriptor does not require it.
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

const handed = {
  accessToken: "handed-access-token",
  refreshToken: "handed-refresh-token",
  expiresIn: 3600,
};

const pairsWithRemote = {
  auth: {
    needs: { commerce: "remote" },
    reason: "signs in the customers of remote only",
  },
};

type Seen = {
  guestTokenHanded: string | undefined;
  vaultToken: string | undefined;
  linked: string | undefined;
  linkCalls: string[];
  /** The first cart call after sign-in: `attachGuestCart` (the BFF takes the guest cart over) or `getActiveCart`. */
  firstCartCall: string | undefined;
  /** Signed in still after the commerce vault entry is gone (the session check ran). */
  keptWithoutCommerceSession: boolean;
};

/**
 * Boots commerce `remote` (guest sessions, links customers, takes guest carts over) with a sign-in built by
 * `fakeIdp(options)` that returns a commerce session, signs alice in as the controller does (guest cart first), then
 * drops the commerce vault entry and runs the session check.
 */
async function signInWith(
  options: Parameters<typeof import("./fixtures").fakeIdp>[0],
): Promise<Seen> {
  let seen: Seen | undefined;
  await jest.isolateModulesAsync(async () => {
    const fx: typeof import("./fixtures") = require("./fixtures");
    const kit: typeof import("@core/integration-kit") = require("@core/integration-kit");
    const remote = fx.inMemoryCommerce({
      id: "remote",
      guestSession: true,
      customers: true,
      attach: true,
    });
    const idp = fx.fakeIdp({ ...options, commerceSession: handed });
    useConfig(() => kit.defineConfig({ commerce: remote, auth: idp }));
    exactEnv({ ...CORE_ENV });
    const app = await boot();
    try {
      const jar: Jar = {};
      const { CartService } = bff("features/cart/cart.service");
      const { CartIdService } = bff("features/cart-id/cart-id.service");
      const { AuthService } = bff("features/auth/auth.service");
      const { TokenStorageService } = bff(
        "common/token-management/token-storage.service",
      );
      const { SessionService } = bff("common/session/session.service");
      const { SessionCheckMiddleware } = bff(
        "common/session/session-check.middleware",
      );
      const { TokenEncryptionService } = bff(
        "common/token-management/token-encryption.service",
      );
      await (await (await request(app, jar)).get(CartService)).createCart();
      const r = await request(app, jar);
      const guestCartId = await (await r.get(CartIdService)).getGuestCartId();
      const service = await r.get(AuthService);
      await service.login({
        email: "alice@example.com",
        password: fx.IDP_PASSWORD,
      });
      const before = remote.state.calls.length;
      await (await r.get(CartService)).setupCartAfterLogin(guestCartId);
      const firstCartCall = remote.state.calls
        .slice(before)
        .map((c) => c.split(" ")[0])
        .find((c) => c === "attachGuestCart" || c === "getActiveCart");
      await service.dropGuestSession();
      const after = await request(app, jar);
      const vaultToken = await (
        await after.get(TokenStorageService)
      ).getAccessToken();
      const linked = await (await after.get(SessionService)).linkedCustomer();
      // the commerce session is gone (expired, refused): the session check decides whether the shopper stays
      for (const name of Object.keys(jar)) {
        if (name.startsWith("vault.commerce.")) delete jar[name];
      }
      const check = new SessionCheckMiddleware(
        app.get(bff("data-source/ports.module").Ports, { strict: false }),
        app.get(TokenEncryptionService, { strict: false }),
      );
      const req = {
        headers: { "accept-language": "en-US" },
        cookies: { ...jar },
      };
      const res = {
        cookie: (n: string, v: string) => (jar[n] = v),
        clearCookie: (n: string) => delete jar[n],
      };
      let failed: unknown;
      await check.use(req, res, (error?: unknown) => (failed = error));
      expect(failed).toBeUndefined();
      seen = {
        guestTokenHanded: idp.guests[0],
        vaultToken,
        linked,
        linkCalls: [...remote.state.customerCalls],
        firstCartCall,
        keptWithoutCommerceSession: jar["shopin-session"] !== undefined,
      };
    } finally {
      await app.close();
    }
  });
  return seen!;
}

/** What every sign-in but the platform's own gets: identity only, linked through `customers`, the cart taken over. */
const identityOnly: Seen = {
  guestTokenHanded: undefined,
  vaultToken: undefined,
  linked: "remote-customer-1",
  linkCalls: expect.arrayContaining([expect.stringMatching(/^create /)]),
  firstCartCall: "attachGuestCart",
  keptWithoutCommerceSession: true,
};

describe("the hand-over between sign-in and commerce: one rule", () => {
  it("an external identity provider (another id, no requirement): identity only", async () => {
    expect(await signInWith({ id: "fake-idp" })).toEqual(identityOnly);
  });

  it("a sign-in that may only pair with this commerce, under another id (like the mock identity): identity only", async () => {
    expect(
      await signInWith({ id: "remote-idp", requires: pairsWithRemote }),
    ).toEqual(identityOnly);
  });

  it("a part with the commerce provider's id whose descriptor does not require it: identity only", async () => {
    expect(await signInWith({ id: "remote" })).toEqual(identityOnly);
  });

  it("the platform's own sign-in (same provider, its descriptor requires this commerce): the whole hand-over", async () => {
    expect(
      await signInWith({ id: "remote", requires: pairsWithRemote }),
    ).toEqual({
      guestTokenHanded: "remote-anon-token-1",
      vaultToken: handed.accessToken,
      // the subject is the customer id: nothing is looked up or written
      linked: "idp|alice",
      linkCalls: [],
      // the platform merged the guest cart at sign-in: its active cart is asked for first
      firstCartCall: "getActiveCart",
      keptWithoutCommerceSession: false,
    });
  });
});
