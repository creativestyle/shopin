#!/usr/bin/env node
/**
 * The deployment's check of a started BFF: `node scripts/checks/bff-capabilities.mjs <BFF base URL>` reads
 * `GET <base>/bff/capabilities` and exits 1 naming every category that is unavailable (its credentials check failed,
 * it cannot serve) and every integration serving through another that cannot serve; 0 when every configured category
 * is served. A category the shop does not configure ("not configured") is not a failure. It names no integration:
 * whatever the BFF reports is what it checks. Exit 2: no URL given, or no readable answer from the BFF.
 */
import { pathToFileURL } from "node:url";

/** The reason `/bff/capabilities` gives a category the shop config leaves out (the BFF's `UNAVAILABLE.notConfigured`). */
export const NOT_CONFIGURED = "not configured";

const isRecord = (v) =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * What is wrong in one `/bff/capabilities` answer: one line per unavailable category and per unavailable
 * integration behind another; empty when everything configured is served. Throws when the answer has not the shape
 * the BFF serves (the check cannot tell, so it must not pass).
 */
export function problemsIn(body) {
  if (
    !isRecord(body) ||
    !isRecord(body.providers) ||
    !isRecord(body.unavailable)
  ) {
    throw new Error(
      "the answer is not a /bff/capabilities answer (no providers or unavailable object)",
    );
  }
  const problems = [];
  for (const [category, reason] of Object.entries(body.unavailable)) {
    if (reason !== NOT_CONFIGURED) {
      problems.push(`${category}: unavailable (${reason})`);
    }
  }
  for (const [category, ids] of Object.entries(
    body.unavailableProviders ?? {},
  )) {
    for (const [id, reason] of Object.entries(ids ?? {})) {
      problems.push(`${category}: "${id}" cannot serve (${reason})`);
    }
  }
  return problems;
}

/** Reads `<base>/bff/capabilities`: { served: category → provider, problems }. Throws when there is no readable answer. */
export async function checkCapabilities(base, { timeoutMs = 10_000 } = {}) {
  const url = new URL("/bff/capabilities", base);
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    throw new Error(`${url} answered ${res.status}`);
  }
  const body = await res.json().catch(() => {
    throw new Error(`${url} answered no JSON`);
  });
  return { served: body?.providers ?? {}, problems: problemsIn(body) };
}

async function main(argv) {
  const base = argv[0];
  if (!base) {
    console.error(
      "usage: node scripts/checks/bff-capabilities.mjs <BFF base URL, e.g. http://localhost:4000>",
    );
    return 2;
  }
  let result;
  try {
    result = await checkCapabilities(base);
  } catch (error) {
    console.error(`bff capabilities: cannot check ${base}: ${error.message}`);
    return 2;
  }
  if (result.problems.length) {
    console.error(
      `bff capabilities: ${result.problems.length} problem(s) at ${base}`,
    );
    for (const line of result.problems) console.error(`  ${line}`);
    return 1;
  }
  const served = Object.entries(result.served).map(([c, p]) => `${c}: ${p}`);
  console.log(`bff capabilities: ok (${served.join(", ")})`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await main(process.argv.slice(2));
}
