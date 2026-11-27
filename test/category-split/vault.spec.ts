/**
 * A shop on the in-memory `local` platform with an identity provider that may only pair with it (S4), and the
 * vault: per-port entries, one refresh at a time, sign-out with the identity provider down.
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
import { defineConfig } from "@core/integration-kit";
import { fakeIdp, inMemoryCommerce, IDP_PASSWORD } from "./fixtures";

const local = inMemoryCommerce({
  id: "local",
  also: ["search", "cms", "psp"],
  customers: true,
  orderPrefix: "L",
});
const idp = fakeIdp({
  id: "local-idp",
  requires: {
    auth: {
      needs: { commerce: "local" },
      reason: "Local sign-in signs in local customers only",
    },
  },
});
let app: Awaited<ReturnType<typeof boot>>;
const jar: Jar = {};

beforeAll(async () => {
  useConfig(() =>
    defineConfig({
      commerce: local,
      search: local,
      cms: local,
      psp: local,
      auth: idp,
    }),
  );
  exactEnv({ ...CORE_ENV });
  app = await boot();
});
afterAll(() => app?.close());

describe("the vault", () => {
  it("vault: a port cannot read another port’s entry; parallel refreshes run once", async () => {
    const { VaultService } = bff("common/vault/vault.service");
    const { TokenEncryptionService } = bff(
      "common/token-management/token-encryption.service",
    );
    const { runInRequest } = bff("common/request-store/request-store");
    const enc = app.get(TokenEncryptionService, { strict: false });
    const res = {
      cookie: (n: string, v: string) => (jar[n] = v),
      clearCookie: (n: string) => delete jar[n],
    };
    const req = { cookies: { ...jar }, res };
    const v = VaultService.forRequest(req, enc);
    await v.set(
      "commerce",
      "other",
      { accessToken: "a", refreshToken: "r", expiresIn: 60 },
      false,
    );
    // the same sealed value under another port's name
    const other = {
      cookies: { "vault.commerce.local": jar["vault.commerce.other"] },
      res,
    };
    const otherView = await runInRequest(other, () =>
      VaultService.forRequest(other, enc).forPart("commerce", "local").get(),
    );
    expect(otherView).toBeUndefined();
    // and the port it belongs to reads it
    const own = {
      cookies: { "vault.commerce.other": jar["vault.commerce.other"] },
      res,
    };
    expect(
      await runInRequest(own, () =>
        VaultService.forRequest(own, enc).forPart("commerce", "other").get(),
      ),
    ).toMatchObject({ accessToken: "a", refreshToken: "r", customer: false });
    let calls = 0;
    const slow = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return { accessToken: "a2", refreshToken: "r2", expiresIn: 60 };
    };
    const a = VaultService.forRequest({ cookies: { ...jar }, res }, enc);
    const b = VaultService.forRequest({ cookies: { ...jar }, res }, enc);
    const [ta, tb] = await Promise.all([
      a.refreshOnce("commerce", "other", slow),
      b.refreshOnce("commerce", "other", slow),
    ]);
    expect(calls).toBe(1);
    expect(ta).toEqual(tb);
    // a refresh of one port's entry leaves another port's entry alone
    const c = VaultService.forRequest({ cookies: { ...jar }, res }, enc);
    expect(await c.refreshOnce("commerce", "local", slow)).toBeUndefined();
    expect(calls).toBe(1);
  });

  it("sign-out works with the identity provider down: session and vault cleared locally", async () => {
    const signIn = await request(app, jar);
    expect(
      await (
        await signIn.get(bff("features/auth/auth.service").AuthService)
      ).login({ email: "alice@example.com", password: IDP_PASSWORD }),
    ).toEqual({ success: true });
    jar["vault.commerce.local"] = "sealed-entry";
    idp.down.signOut = true;
    idp.state.calls.length = 0;
    expect(jar["shopin-session"]).toBeDefined();
    const r = await request(app, jar);
    await (await r.get(bff("features/auth/auth.service").AuthService)).logout();
    idp.down.signOut = false;
    expect(idp.state.calls).toEqual(["signOut alice@example.com"]);
    expect(
      Object.keys(jar).filter(
        (k) => k === "shopin-session" || k.startsWith("vault."),
      ),
    ).toEqual([]);
  });
});
