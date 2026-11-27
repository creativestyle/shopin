export interface Recording {
  status?: number
  body: unknown
  headers?: Record<string, string>
}

/**
 * A `fetch` that answers from recorded responses, keyed `"<METHOD> <url>"` (a list answers repeated requests in
 * order). Any other request throws, naming it: a connector's test never reaches the network, and a request the
 * connector did not make before shows up as a failure. `calls` lists the requests served.
 */
export function recordedFetch(
  recordings: Record<string, Recording | Recording[]>
): typeof fetch & { calls: string[] } {
  const calls: string[] = []
  const left = new Map(
    Object.entries(recordings).map(([k, v]) => [k, [v].flat()])
  )
  const replay = async (input: unknown, init?: { method?: string }) => {
    const url = String(input instanceof Request ? input.url : input)
    const key = `${(init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()} ${url}`
    calls.push(key)
    const queue = left.get(key)
    const r = queue && (queue.length > 1 ? queue.shift() : queue[0])
    if (!r) {
      throw new Error(`recordedFetch: no recording for ${key}`)
    }
    return new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { 'content-type': 'application/json', ...r.headers },
    })
  }
  return Object.assign(replay as typeof fetch, { calls })
}

/** A token vault in memory (one shopper). */
