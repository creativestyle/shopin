/**
 * S3 auth swap: commerce = `remote` (an in-memory platform that needs a guest session and can link
 * customers), auth = an external identity provider (`fake-idp`, the stand-in for Auth0). What is under
 * test is the BFF's linking policy across the two ports: which lookups and writes it asks the commerce
 * port for, the provider it stamps, the session it writes, the guest-cart takeover. What commercetools
 * does with those calls is tested in integrations/commerce/commercetools/test.
 */
import {
  CORE_ENV,
  exactEnv,
  boot,
  loaded,
  request,
  useConfig,
  bff,
  idIn,
  type Jar,
} from "./harness";
import { defineConfig } from "@core/integration-kit";
import { fakeIdp, inMemoryCommerce, IDP_PASSWORD } from "./fixtures";

const remote = inMemoryCommerce({
  id: "remote",
  also: ["search", "cms"],
  guestSession: true,
  customers: true,
});
const idp = fakeIdp({ id: "fake-idp" });
const calls = remote.state.customerCalls;

let app: Awaited<ReturnType<typeof boot>>;
const jar: Jar = {};

beforeAll(async () => {
  useConfig(() =>
    defineConfig({ commerce: remote, search: remote, cms: remote, auth: idp }),
  );
  exactEnv({ ...CORE_ENV });
  app = await boot();
});
afterAll(() => app?.close());

async function signIn(email: string) {
  const { CartIdService } = bff("features/cart-id/cart-id.service");
  const { AuthService } = bff("features/auth/auth.service");
  const { CartService } = bff("features/cart/cart.service");
  const r = await request(app, jar);
  const guestCartId = await (await r.get(CartIdService)).getGuestCartId();
  // the controller's sequence: sign-in, guest-cart takeover, then the guest token is dropped
  const auth = await r.get(AuthService);
  const result = await auth.login({ email, password: IDP_PASSWORD });
  await (await r.get(CartService)).setupCartAfterLogin(guestCartId);
  await auth.dropGuestSession();
  return result;
}

async function session() {
  const { SessionService } = bff("common/session/session.service");
  return (await request(app, jar)).get(SessionService) as Promise<{
    linkedCustomer(): Promise<string | undefined>;
    identity(): Promise<{ provider: string; subject: string } | undefined>;
  }>;
}

describe("S3: a commerce platform with an external identity provider", () => {
  it("only the chosen ports are loaded", () => {
    expect(loaded()).toEqual([
      "commerce:remote",
      "search:remote",
      "cms:remote",
      "auth:fake-idp",
    ]);
  });

  it("a guest cart survives sign-in; a verified identity is linked to a new customer", async () => {
    const { CartService } = bff("features/cart/cart.service");
    const r = await request(app, jar);
    const guestCart = await (await r.get(CartService)).createCart();
    // the commerce port's own guest session lives in its vault entry, encrypted (JWE): the browser never
    // sees a provider token; the port acted with exactly that token
    expect(jar["vault.commerce.remote"]!.split(".").length).toBe(5);
    expect(remote.state.actedWith).toEqual(["remote-anon-token-1"]);
    // the browser holds the cart id sealed, never the platform's id
    expect(jar["cart-guest.remote-USD"]).not.toContain(guestCart.id);
    expect(await idIn(jar, "cart-guest.remote-USD")).toBe(guestCart.id);
    expect(await signIn("alice@example.com")).toEqual({ success: true });
    expect(calls).toEqual([
      "findByExternalId fake-idp:idp|alice",
      "findByEmail alice@example.com",
      "create alice@example.com fake-idp:idp|alice",
    ]);
    expect(await idIn(jar, "cart-logged.remote-USD")).toBe(guestCart.id);
    // the guest's anonymous token served the cart takeover and is not kept after sign-in
    expect(Object.keys(jar).sort()).toEqual([
      "cart-logged.remote-USD",
      "shopin-session",
    ]);
    // the session acts for the linked customer, and the commerce port is told so (CustomerContext)
    expect(await (await session()).linkedCustomer()).toBe("remote-customer-1");
  });

  it("the commerce port acts for the linked customer, without a guest token", async () => {
    const { CartService } = bff("features/cart/cart.service");
    remote.state.actedWith.length = 0;
    remote.state.calls.length = 0;
    const r = await request(app, jar);
    const cart = await (
      await r.get(CartService)
    ).addToCart({ productId: "p-1", quantity: 1 } as never);
    expect(cart.id).toBe(await idIn(jar, "cart-logged.remote-USD"));
    expect(remote.state.calls).toEqual([
      `addToCart ${cart.id} as remote-customer-1`,
    ]);
    expect(remote.state.actedWith).toEqual([]);
    // the guest cart was taken over by the linked customer on first use
    expect(remote.state.carts.find((c) => c.id === cart.id)!.customerId).toBe(
      "remote-customer-1",
    );
  });

  it("the same identity again is found by external id", async () => {
    calls.length = 0;
    await signIn("alice@example.com");
    expect(calls).toEqual(["findByExternalId fake-idp:idp|alice"]);
  });

  it("an unverified e-mail is refused and no session is written", async () => {
    const before = jar["shopin-session"];
    calls.length = 0;
    const err = (await signIn("bob@example.com").catch(
      (e: Error) => e,
    )) as Error & { status?: number };
    expect(err.status).toBe(403);
    expect(calls).toEqual([]);
    expect(jar["shopin-session"]).toBe(before);
  });

  it("an existing password customer with the same e-mail is never linked (no takeover), nothing is written", async () => {
    remote.state.customers.push({
      id: "remote-carol",
      email: "carol@example.com",
      hasPassword: true,
    });
    calls.length = 0;
    const before = jar["shopin-session"];
    const err = (await signIn("carol@example.com").catch(
      (e: Error) => e,
    )) as Error & { status?: number };
    expect(err.status).toBe(409);
    expect(calls).toEqual([
      "findByExternalId fake-idp:idp|carol",
      "findByEmail carol@example.com",
    ]);
    expect(jar["shopin-session"]).toBe(before);
    expect(
      remote.state.customers.find((c) => c.id === "remote-carol")!.externalId,
    ).toBeUndefined();
  });

  it("a customer without password or external id is linked by verified e-mail (one write)", async () => {
    remote.state.customers.push({
      id: "remote-erin",
      email: "erin@example.com",
      hasPassword: false,
    });
    idp.users.set("erin@example.com", {
      subject: "idp|erin",
      email: "erin@example.com",
      emailVerified: true,
    });
    calls.length = 0;
    await signIn("erin@example.com");
    expect(calls).toEqual([
      "findByExternalId fake-idp:idp|erin",
      "findByEmail erin@example.com",
      "setExternalId remote-erin fake-idp:idp|erin",
    ]);
    expect(await (await session()).linkedCustomer()).toBe("remote-erin");
  });

  it("the identity provider is stamped by the BFF: a port that claims to be the commerce platform is not trusted", async () => {
    // dave's identity provider answers with provider "remote" and another customer's id as subject
    idp.users.set("dave@example.com", {
      provider: "remote",
      subject: "remote-customer-1",
      email: "dave@example.com",
      emailVerified: true,
    });
    calls.length = 0;
    await signIn("dave@example.com");
    const s = await session();
    const identity = await s.identity();
    expect(identity!.provider).toBe("fake-idp");
    expect(await s.linkedCustomer()).not.toBe("remote-customer-1");
    expect(calls[0]).toBe("findByExternalId fake-idp:remote-customer-1");
  });

  it("sign-out clears the session and every vault entry, then asks the identity provider", async () => {
    idp.state.calls.length = 0;
    const { AuthService } = bff("features/auth/auth.service");
    expect(jar["shopin-session"]).toBeDefined();
    await (await (await request(app, jar)).get(AuthService)).logout();
    expect(idp.state.calls).toEqual(["signOut dave@example.com"]);
    expect(
      Object.keys(jar).filter(
        (k) => k === "shopin-session" || k.startsWith("vault."),
      ),
    ).toEqual([]);
  });

  it("an identity provider that may only pair with another commerce platform cannot be configured here", () => {
    const paired = fakeIdp({
      id: "paired-idp",
      requires: {
        auth: {
          needs: { commerce: "local" },
          reason: "Paired sign-in signs in local customers only",
        },
      },
    });
    expect(() => defineConfig({ commerce: remote, auth: paired })).toThrow(
      '"paired-idp" as auth needs commerce "local": Paired sign-in signs in local customers only',
    );
  });
});
