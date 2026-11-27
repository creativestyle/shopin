/**
 * Boots the real BFF AppModule (no listen()) against the shop config a spec mocks (`@shopin/config`, built
 * from the fixture integrations in ./fixtures), with an explicit environment: the BFF core's own variables
 * plus whatever the test passes. The .env file is ignored. Nothing here names an integration package.
 */
import { randomBytes } from "crypto";
import type { TestingModule } from "@nestjs/testing";
import type { ShopinConfig } from "@core/integration-kit/core";
// Nest and the BFF are required inside each function: a test may boot twice in isolated module registries

export const key = () => randomBytes(32).toString("base64");

/** The BFF core's own env (no port variable). */
export const CORE_ENV: Record<string, string> = {
  SHOPIN_IGNORE_ENV_FILE: "1",
  JWT_ENCRYPTION_KEY: key(),
  JWT_SIGNING_KEY: key(),
  CSRF_TOKEN_ENCRYPTION_KEY: key(),
  CSRF_TOKEN_SIGNING_KEY: key(),
  FRONTEND_URL: "http://localhost:3000",
  LOG_LEVEL: "silent",
};

let reads: Set<string> | undefined;

/**
 * Replaces process.env with exactly these variables. `read` collects every name read from process.env
 * after the BFF has moved the port variables out of it (boot clears it then), i.e. what the core, the
 * ports and their libraries read while booting and serving.
 */
export function exactEnv(vars: Record<string, string>): { read: Set<string> } {
  const read = (reads = new Set<string>());
  const store = { ...vars };
  process.env = new Proxy(store, {
    get: (t, p) => {
      if (typeof p === "string") read.add(p);
      return (t as Record<string, string>)[p as string];
    },
  }) as NodeJS.ProcessEnv;
  return { read };
}

/** Mocks `@shopin/config` with this config for the next boot (call before `boot`, in the same registry). */
export function useConfig(build: () => ShopinConfig): void {
  jest.doMock("@shopin/config", () => ({ config: build() }));
}

/** A path inside the BFF source, required in the current module registry. */
export const bff = (path: string) => require(`@apps/bff/src/${path}`); // eslint-disable-line @typescript-eslint/no-require-imports

/** Calls on a resolved service run as part of serving `req` (the request store the slot accessors read). */
export function servingRequest<T extends object>(req: object, instance: T): T {
  const { runInRequest } = bff("common/request-store/request-store");
  return new Proxy(instance, {
    get(target, key) {
      const value = Reflect.get(target, key);
      return typeof value === "function"
        ? (...args: unknown[]) =>
            runInRequest(req, () => value.apply(target, args))
        : value;
    },
  });
}

export type Jar = Record<string, string>;

/**
 * The cart or wishlist id cookie `name` of `jar` holds, opened with the core keys (the browser sees only the
 * sealed value); undefined when it is missing or does not open.
 */
export async function idIn(
  jar: Jar,
  name: string,
): Promise<string | undefined> {
  if (!jar[name]) return undefined;
  const { TokenEncryptionService } = bff(
    "common/token-management/token-encryption.service",
  );
  const quiet = { setContext() {}, error() {}, warn() {}, debug() {} };
  try {
    return JSON.parse(
      await new TokenEncryptionService(quiet).decryptAndVerify(
        jar[name],
        `shopin-id:${name}`,
      ),
    ).id;
  } catch {
    return undefined;
  }
}

export async function boot(): Promise<TestingModule> {
  // the env split runs first (app.module also calls it at import; it runs once)
  bff("common/env/env-file").loadEnvFile();
  reads?.clear();
  const { Test } = require("@nestjs/testing");
  const { AppModule } = bff("app.module");
  // AppModule's PortsModule.forRoot() reads the port env and loads the ports while the module compiles
  const app = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  await app.init();
  return app;
}

/**
 * The booted BFF over HTTP (as main.ts serves it: `/bff` prefix, the error filter, every global guard), on a free
 * local port: `fetch(path, init)` answers status, body and the cookies it set (`name=value`). Close it with `close()`
 * (it closes the app too).
 */
export async function http(app: TestingModule) {
  const { HttpErrorFilter } = bff("common/filters/http-exception.filter");
  const server = app.createNestApplication({ logger: false });
  server.use(require("cookie-parser")());
  server.useGlobalFilters(new HttpErrorFilter());
  server.setGlobalPrefix("bff");
  await server.listen(0, "127.0.0.1");
  const base = (await server.getUrl()).replace("[::1]", "127.0.0.1");
  return {
    /** The BFF's base URL (`http://127.0.0.1:<port>`; its routes under `/bff`). */
    base,
    fetch: async (path: string, init?: RequestInit) => {
      const res = await fetch(`${base}${path}`, init);
      const cookies = res.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0]);
      return {
        status: res.status,
        body: await res.json().catch(() => null),
        cookies,
      };
    },
    close: () => server.close(),
  };
}

/** The ports this BFF loaded, as `category:id`. */
export const loaded = (): string[] =>
  bff("data-source/ports.module")
    .loadedPorts()
    .map((p: { category: string; id: string }) => `${p.category}:${p.id}`);

/** One HTTP request (a port that serves through others may read its headers), with a shared cookie jar. */
export async function request(
  app: TestingModule,
  jar: Jar,
  headers: Record<string, string> = {},
) {
  const { ContextIdFactory } = require("@nestjs/core");
  const {
    REQUEST_CONTEXT_ID,
  } = require("@nestjs/core/router/request/request-constants");
  const req = {
    headers: { "accept-language": "en-US", ...headers },
    cookies: { ...jar },
    res: {
      cookie: (name: string, value: string) => {
        jar[name] = value;
      },
      clearCookie: (name: string) => {
        delete jar[name];
      },
    },
  };
  const contextId = ContextIdFactory.create();
  Object.defineProperty(req, REQUEST_CONTEXT_ID, { value: contextId });
  app.registerRequestByContextId(req, contextId);
  // BFF classes are required at run time (`bff(...)`, typed any): resolved instances are typed any too
  const get = async <T = any>( // eslint-disable-line @typescript-eslint/no-explicit-any
    type: (abstract new (...args: never[]) => T) | string,
  ): Promise<T> => {
    let instance: T;
    try {
      instance = (await app.resolve(type as never, contextId, {
        strict: false,
      })) as T;
    } catch {
      instance = app.get(type as never, { strict: false }) as T;
    }
    return servingRequest(req, instance as object) as T;
  };
  /** Runs `fn` as part of serving this request. */
  const serve = <T>(fn: () => T): T =>
    bff("common/request-store/request-store").runInRequest(req, fn);
  return { req, get, serve };
}

/**
 * Boots the BFF with the config `build` makes (fixtures and kit of this module registry) and reports what it loaded:
 * the ports, their Nest modules and whether any provider is request-scoped, and the provider a request with
 * `X-Commerce-Provider: local` gets.
 */
export async function inspect(
  build: (
    fx: typeof import("./fixtures"),
    kit: typeof import("@core/integration-kit"),
  ) => unknown,
) {
  let out: Record<string, unknown> = {};
  await jest.isolateModulesAsync(async () => {
    // fixtures and kit from this registry: their DI tokens must be the ones the BFF of this boot uses
    const fx: typeof import("./fixtures") = require("./fixtures");
    const kit: typeof import("@core/integration-kit") = require("@core/integration-kit");
    const core: typeof import("@core/integration-kit/core") = require("@core/integration-kit/core");
    useConfig(() => build(fx, kit) as never);
    exactEnv({ ...CORE_ENV });
    const app = await boot();
    const { ModulesContainer } = require("@nestjs/core");
    const { loadedPorts, Services } = bff("data-source/ports.module");
    const { CapabilitiesController } = bff(
      "features/capabilities/capabilities.controller",
    );
    const { config } = require("@shopin/config");
    // the BFF wraps each port in its own Nest module, named `<id>:<category>`
    const portModules = new Set(
      loadedPorts().map(
        (p: { category: string; id: string }) => `${p.id}:${p.category}`,
      ),
    );
    const requestScoped: string[] = [];
    const seen = new Set<string>();
    let factoryStatic: boolean | undefined;
    let checked = 0;
    for (const mod of (
      app.get(ModulesContainer) as Map<string, any>
    ).values()) {
      const isPort = portModules.has(mod.metatype?.name);
      if (isPort) seen.add(mod.metatype.name);
      for (const [token, wrapper] of mod.providers) {
        if (isPort) checked++;
        if (isPort && !wrapper.isDependencyTreeStatic())
          requestScoped.push(
            `${mod.metatype.name}:${String(typeof token === "function" ? token.name : token)}`,
          );
        if (token === Services)
          factoryStatic = wrapper.isDependencyTreeStatic();
      }
    }
    const jar: Jar = {};
    const r = await request(app, jar, { "x-commerce-provider": "local" });
    const caps = (await r.get(CapabilitiesController)).getCapabilities();
    out = {
      ports: loaded(),
      portModulesFound: [...seen].sort(),
      portModulesExpected: [...portModules].sort(),
      checked,
      requestScoped,
      factoryStatic,
      commerceWithLocalHeader: caps.providers.commerce,
      storefrontHeaders: core
        .storefrontData(config)
        .variants.dimensions.map((d: { header: string }) => d.header),
    };
    await app.close();
  });
  return out;
}
