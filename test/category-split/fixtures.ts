/**
 * Fixture integrations for the scenario tests: in-memory commerce, search, cms and psp ports and a fake
 * identity provider, declared with the integration kit exactly as a real integration is. They name no
 * vendor and need no network, so the scenarios run whatever `config/shop/shopin.config.ts` says.
 *
 * Each factory returns the integration plus `state`: what its ports were handed (options, vault entry,
 * linked customer) and every call they served, for the specs to assert on.
 */
import { createHash, randomUUID } from "node:crypto";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import {
  CustomerContext,
  defineIntegration,
  port,
  PortOptions,
  TokenVault,
  type Category,
  type CustomerRecord,
  type EnvSchema,
  type Integration,
  type Port,
  type Requirement,
  type SessionTokens,
  type SignedIn,
} from "@core/integration-kit";

/** A service object whose unimplemented methods fail loudly (a scenario never relies on them silently). */
function service<T extends object>(owner: string, name: string, impl: T): T {
  return new Proxy(impl, {
    get(target, key) {
      if (key in target || typeof key === "symbol" || key === "then")
        return Reflect.get(target, key);
      return () => {
        throw new Error(`fixture ${owner}: ${name}.${key} is not implemented`);
      };
    },
  });
}

export interface FixtureState {
  /** The options each port of this integration was handed, per category. */
  options: Partial<Record<Category, Record<string, string | undefined>>>;
  /** `process.env[name]` as each port factory saw it (names from `snoop`). */
  snooped: Record<string, string | undefined>;
  /** Every call the ports served, in order. */
  calls: string[];
}

const newState = (): FixtureState => ({ options: {}, snooped: {}, calls: [] });

/** The descriptor, declared with the kit like a real integration's `shopin.ts`. */
function descriptor<P extends Category>(
  o: Common,
  ports: Integration<string, P>["ports"],
): Integration<string, P> {
  return defineIntegration<string, P>({
    id: o.id,
    label: o.label ?? o.id,
    description: `${o.id} test fixture`,
    ...(o.env ? { env: o.env as Integration<string, P>["env"] } : {}),
    ...(o.requires
      ? { requires: o.requires as Integration<string, P>["requires"] }
      : {}),
    ...(o.omits ? { omits: o.omits } : {}),
    ports,
  });
}

type Fixture<P extends Category> = Integration<string, P> & {
  state: FixtureState;
};

interface Common {
  id: string;
  label?: string;
  env?: Partial<Record<Category, EnvSchema>>;
  requires?: Partial<Record<Category, Requirement>>;
  /** Variables each port factory tries to read from `process.env` (it must find none of a port's). */
  snoop?: string[];
  /** The descriptor's `omits` (optional commerce services it says it leaves out). */
  omits?: Integration["omits"];
}

function record(
  state: FixtureState,
  category: Category,
  options: object,
  snoop: string[] = [],
) {
  state.options[category] = { ...(options as Record<string, string>) };
  for (const name of snoop) state.snooped[name] = process.env[name];
}

// ─── Commerce ────────────────────────────────────────────────────────────────────────────────

export interface FixtureCart {
  id: string;
  customerId?: string;
  lineItems: {
    id: string;
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  /** The shop's own fields (`setCartFields`). */
  fields?: Record<string, unknown>;
}

export interface FixtureCustomer {
  id: string;
  email: string;
  externalId?: string;
  hasPassword: boolean;
}

export interface FixtureOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  createdAt: string;
  orderState: string;
  grandTotal: {
    regularPriceInCents: number;
    currency: string;
    fractionDigits: number;
  };
  currency: string;
  itemCount: number;
  lineItemImages: unknown[];
}

export interface CommerceState extends FixtureState {
  carts: FixtureCart[];
  customers: FixtureCustomer[];
  orders: FixtureOrder[];
  /** The vault access token each guest cart call acted with (guest-session platforms only). */
  actedWith: string[];
  /** Calls on the customer store only (the linking policy's lookups and writes). */
  customerCalls: string[];
}

export interface CommerceOptions extends Common {
  /** Also serve these categories from the same integration (one shared in-memory catalog). */
  also?: ("search" | "cms" | "psp")[];
  /** The platform needs its own anonymous session for guests (a token in its vault entry). */
  guestSession?: boolean;
  /** The platform can link customers of another identity provider (`customers` port member). */
  customers?: boolean;
  /** Prefix of order numbers, e.g. `L` → `L-00001`. */
  orderPrefix?: string;
  /** The platform cannot list a customer's carts (`getActiveCart` finds none), like Medusa's store API. */
  unlistedCarts?: boolean;
  /** The port has `attachGuestCart`. */
  attach?: boolean;
  /** The port has `setCartFields` (kept on the fixture cart as `fields`). */
  cartFields?: boolean;
  /** The port has no `wishlistService` (independent of the descriptor's `omits`, to test that they must agree). */
  noWishlist?: boolean;
}

const PRICE = 1000;

/**
 * An in-memory commerce platform. Carts and orders belong to the customer the BFF says this request acts
 * for (CustomerContext); with `guestSession`, a guest cart needs the anonymous token in the port's own vault
 * entry, like a real platform's `me` API.
 */
export function inMemoryCommerce(
  o: CommerceOptions,
): Fixture<Category> & { state: CommerceState } {
  const state: CommerceState = {
    ...newState(),
    carts: [],
    customers: [],
    orders: [],
    actedWith: [],
    customerCalls: [],
  };
  let n = 0;
  const commerce = port("commerce", {
    inject: [PortOptions, TokenVault, CustomerContext],
    useFactory: (
      options: PortOptions,
      vault: TokenVault,
      who: CustomerContext,
    ) => {
      record(state, "commerce", options, o.snoop);
      const svc = <T extends object>(name: string, impl: T) =>
        service(o.id, name, impl);
      const total = (c: FixtureCart) => ({
        regularPriceInCents: c.lineItems.reduce(
          (s, l) => s + l.quantity * PRICE,
          0,
        ),
        currency: "USD",
        fractionDigits: 2,
      });
      const view = (c: FixtureCart) => ({
        id: c.id,
        lineItems: c.lineItems,
        grandTotal: total(c),
      });
      /** The guest's platform session (guest-session platforms) or nothing; a customer needs none. */
      const actor = async (what: string) => {
        const customerId = await who.customerId();
        if (!customerId && o.guestSession) {
          const entry = await vault.get();
          if (!entry)
            throw new UnauthorizedException(
              `${o.id}: ${what} without a guest session`,
            );
          state.actedWith.push(entry.accessToken);
        }
        state.calls.push(`${what} as ${customerId ?? "guest"}`);
        return customerId;
      };
      const cartOf = (id: string, customerId: string | undefined) => {
        const c = state.carts.find((x) => x.id === id);
        // a cart of another customer is not found; a guest cart may be taken over by a customer
        if (!c || (c.customerId && c.customerId !== customerId))
          throw new NotFoundException(`Cart not found: ${id}`);
        if (customerId && !c.customerId) c.customerId = customerId;
        return c;
      };
      const services = {
        productService: svc("productService", {
          getProduct: async (slug: string) => ({
            product: { slug, name: `${o.id}:${slug}` },
            breadcrumb: [],
          }),
        }),
        productCollectionService: svc("productCollectionService", {}),
        productSearchService: svc("productSearchService", {}),
        navigationService: svc("navigationService", {}),
        cartService: svc("cartService", {
          createCart: async () => {
            const customerId = await actor("createCart");
            const c: FixtureCart = {
              id: `${o.id}-cart-${++n}`,
              ...(customerId ? { customerId } : {}),
              lineItems: [],
            };
            state.carts.push(c);
            return view(c);
          },
          getCart: async (id: string) =>
            view(cartOf(id, await actor(`getCart ${id}`))),
          addToCart: async (
            id: string,
            productId: string,
            variantId: string | undefined,
            quantity: number,
          ) => {
            const c = cartOf(id, await actor(`addToCart ${id}`));
            c.lineItems.push({
              id: `li-${++n}`,
              productId,
              variantId,
              quantity,
            });
            return view(c);
          },
          getActiveCart: async () => {
            const customerId = await actor("getActiveCart");
            if (o.unlistedCarts) return null;
            const c =
              customerId &&
              state.carts.find((x) => x.customerId === customerId);
            return c ? view(c) : null;
          },
        }),
        cartPaymentService: svc("cartPaymentService", {}),
        storeConfigService: svc("storeConfigService", {}),
        ...(o.noWishlist
          ? {}
          : {
              wishlistService: svc("wishlistService", {
                getOrCreateWishlist: async () => {
                  await actor("getOrCreateWishlist");
                  return { id: `${o.id}-wishlist`, items: [], itemCount: 0 };
                },
              }),
            }),
        customerService: svc("customerService", {}),
        customerAddressService: svc("customerAddressService", {}),
        orderService: svc("orderService", {
          createOrder: async ({ cartId }: { cartId: string }) => {
            const customerId = await actor(`createOrder ${cartId}`);
            const c = cartOf(cartId, customerId);
            const seq = state.orders.length + 1;
            const order: FixtureOrder = {
              id: `${o.id}-order-${seq}`,
              orderNumber: `${o.orderPrefix ?? o.id.toUpperCase()}-${String(seq).padStart(5, "0")}`,
              ...(customerId ? { customerId } : {}),
              createdAt: new Date().toISOString(),
              orderState: "Open",
              grandTotal: total(c),
              currency: "USD",
              itemCount: c.lineItems.length,
              lineItemImages: [],
            };
            state.orders.push(order);
            state.carts.splice(state.carts.indexOf(c), 1);
            return order;
          },
          // like a platform that keeps all guest orders together: any guest may read any guest order here
          getOrder: async (orderId: string) => {
            const customerId = await actor(`getOrder ${orderId}`);
            const order = state.orders.find(
              (x) => x.id === orderId && x.customerId === customerId,
            );
            if (!order)
              throw new NotFoundException(`Order not found: ${orderId}`);
            return order;
          },
          getOrders: async () => {
            const customerId = await actor("getOrders");
            const orders = state.orders.filter(
              (x) => customerId && x.customerId === customerId,
            );
            return {
              orders,
              total: orders.length,
              offset: 0,
              limit: orders.length,
            };
          },
        }),
      };
      const customers = o.customers && {
        findByExternalId: async (
          externalId: string,
        ): Promise<CustomerRecord | undefined> => {
          state.customerCalls.push(`findByExternalId ${externalId}`);
          return state.customers.find((c) => c.externalId === externalId);
        },
        findByEmail: async (
          email: string,
        ): Promise<CustomerRecord | undefined> => {
          state.customerCalls.push(`findByEmail ${email}`);
          return state.customers.find((c) => c.email === email.toLowerCase());
        },
        setExternalId: async (customerId: string, externalId: string) => {
          state.customerCalls.push(`setExternalId ${customerId} ${externalId}`);
          state.customers.find((c) => c.id === customerId)!.externalId =
            externalId;
        },
        create: async (identity: SignedIn, externalId: string) => {
          state.customerCalls.push(`create ${identity.email} ${externalId}`);
          const id = `${o.id}-customer-${state.customers.length + 1}`;
          state.customers.push({
            id,
            email: identity.email,
            externalId,
            hasPassword: false,
          });
          return id;
        },
      };
      let sessions = 0;
      const guestSession = o.guestSession && {
        createGuestSession: async (): Promise<SessionTokens> => {
          sessions++;
          state.calls.push("createGuestSession");
          return {
            accessToken: `${o.id}-anon-token-${sessions}`,
            refreshToken: `${o.id}-refresh-token-${sessions}`,
            expiresIn: 3600,
          };
        },
        refresh: async (refreshToken: string): Promise<SessionTokens> => {
          state.calls.push(`refresh ${refreshToken}`);
          return {
            accessToken: `${o.id}-refreshed-token`,
            refreshToken: `${o.id}-refreshed-refresh-token`,
            expiresIn: 3600,
          };
        },
      };
      /** Hands a guest cart to the customer this request acts for; another customer's cart is not found. */
      const attachGuestCart =
        o.attach &&
        (async (cartId: string) => {
          const customerId = await actor(`attachGuestCart ${cartId}`);
          if (!customerId)
            throw new UnauthorizedException("attachGuestCart needs a customer");
          return view(cartOf(cartId, customerId));
        });
      const setCartFields =
        o.cartFields &&
        (async (cartId: string, fields: Record<string, unknown>) => {
          const c = cartOf(cartId, await actor(`setCartFields ${cartId}`));
          c.fields = { ...c.fields, ...fields };
          return view(c);
        });
      return {
        ...services,
        ...(customers ? { customers } : {}),
        ...(guestSession ? { guestSession } : {}),
        ...(attachGuestCart ? { attachGuestCart } : {}),
        ...(setCartFields ? { setCartFields } : {}),
      } as unknown as Port<"commerce">;
    },
  });
  const extra = Object.fromEntries(
    (o.also ?? []).map((c) => [c, () => portsOf(o, state)[c]()]),
  );
  return Object.assign(
    descriptor(o, {
      commerce: () => commerce,
      ...extra,
    } as Integration["ports"]),
    { state },
  ) as Fixture<Category> & { state: CommerceState };
}

// ─── Search, cms, psp ────────────────────────────────────────────────────────────────────────

function portsOf(o: Common, state: FixtureState) {
  const factory = <C extends Category>(
    category: C,
    build: (options: PortOptions) => unknown,
  ) =>
    port(category, {
      inject: [PortOptions],
      useFactory: (options: PortOptions) => {
        record(state, category, options, o.snoop);
        // only the members the scenarios call; any other fails loudly (see `service`)
        return build(options) as Port<C>;
      },
    });
  return {
    search: () =>
      factory("search", () => ({
        searchService: service(o.id, "searchService", {}),
      })) as never,
    cms: () =>
      factory("cms", (options) => ({
        pageService: service(o.id, "pageService", {
          getPage: async (slug: string) => {
            state.calls.push(`getPage ${slug}`);
            // the page names the space option the port was handed: proof the options reached it
            const space = options["space"] ? `/${options["space"]}` : "";
            return { slug, title: `${o.id}${space}:${slug}`, components: [] };
          },
        }),
        layoutService: service(o.id, "layoutService", {
          getHeader: async () => null,
          getFooter: async () => null,
        }),
      })) as never,
    psp: () =>
      factory("psp", () => ({
        paymentService: service(o.id, "paymentService", {}),
      })) as never,
  } as Record<"search" | "cms" | "psp", () => ReturnType<typeof port>>;
}

/** An integration that serves only search, cms or psp (no commerce). */
export function contentOnly<C extends "search" | "cms" | "psp">(
  o: Common & { serves: C[] },
): Fixture<C> {
  const state = newState();
  const all = portsOf(o, state);
  return Object.assign(
    descriptor<C>(
      o,
      Object.fromEntries(
        o.serves.map((c) => [c, all[c]]),
      ) as unknown as Integration<string, C>["ports"],
    ),
    { state },
  );
}

// ─── Identity ────────────────────────────────────────────────────────────────────────────────

export interface IdpUser {
  subject: string;
  email: string;
  emailVerified: boolean;
  /** A misbehaving identity provider may claim any provider; the BFF must overwrite it. */
  provider?: string;
}

export const IDP_PASSWORD = "idp-password";

export const idpUsers = (): Map<string, IdpUser> =>
  new Map([
    [
      "alice@example.com",
      { subject: "idp|alice", email: "alice@example.com", emailVerified: true },
    ],
    [
      "bob@example.com",
      { subject: "idp|bob", email: "bob@example.com", emailVerified: false },
    ],
    [
      "carol@example.com",
      { subject: "idp|carol", email: "carol@example.com", emailVerified: true },
    ],
  ]);

/**
 * A fake external identity provider (the stand-in for Auth0): returns who signed in, knows no customer.
 * `users` is shared with the spec, which may add users; `down` makes sign-out fail.
 */
export function fakeIdp(
  o: Common & {
    users?: Map<string, IdpUser>;
    /** Returned with every identity, as a commerce platform's own sign-in returns the customer's session. */
    commerceSession?: SessionTokens;
  },
): Fixture<"auth"> & {
  users: Map<string, IdpUser>;
  down: { signOut: boolean };
  /** The guest's commerce token each sign-in was handed (undefined: none). */
  guests: (string | undefined)[];
} {
  const state = newState();
  const users = o.users ?? idpUsers();
  const down = { signOut: false };
  const guests: (string | undefined)[] = [];
  const auth = port("auth", {
    inject: [PortOptions],
    useFactory: (options: PortOptions): Port<"auth"> => {
      record(state, "auth", options, o.snoop);
      return {
        signIn: async ({ email, password }, guest) => {
          state.calls.push(`signIn ${email}`);
          guests.push(guest?.commerceAccessToken);
          const user = users.get(email);
          if (!user || password !== IDP_PASSWORD)
            throw new UnauthorizedException("Invalid email or password");
          return {
            identity: user as SignedIn,
            ...(o.commerceSession
              ? { commerceSession: o.commerceSession }
              : {}),
          };
        },
        signUp: async () => {
          throw new UnauthorizedException("no sign-up");
        },
        signOut: async (identity) => {
          state.calls.push(`signOut ${identity.email}`);
          if (down.signOut) throw new Error("identity provider down");
        },
        refresh: async (identity) => users.get(identity.email) as SignedIn,
      };
    },
  });
  return Object.assign(descriptor<"auth">(o, { auth: () => auth }), {
    state,
    users,
    down,
    guests,
  });
}
