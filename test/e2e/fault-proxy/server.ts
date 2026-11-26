/**
 * Fault proxy: sits in front of the BFF for both the browser and the storefront
 * server, forwards every request, and makes chosen routes fail.
 *
 * Control API (never forwarded):
 *   GET    /__e2e/faults  active rules, with how many requests each caught
 *   POST   /__e2e/faults  add a rule (FaultRule)
 *   DELETE /__e2e/faults  remove all rules and release held requests
 *   GET    /__e2e/ready   200 once the whole stack is up, 503 before
 *   POST   /__e2e/reset-mock  starts the mock over with empty stores (the
 *                             start script restarts the BFF)
 */

import http from 'node:http'

export interface FaultRule {
  /** Regular expression source matched against the request path, e.g. "^/bff/cart". */
  path: string
  method?: string
  /** Answer with this status (default 500) unless `hang` or a plain `delayMs` is set. */
  status?: number
  body?: unknown
  /** Never answer; the request is held until the rules are reset. */
  hang?: boolean
  /** Wait this long first; without `status` the request is then forwarded as usual. */
  delayMs?: number
  /** Apply to this many matching requests, then stop (default: all). */
  times?: number
}

export const FAULTS_PATH = '/__e2e/faults'
export const READY_PATH = '/__e2e/ready'
export const RESET_MOCK_PATH = '/__e2e/reset-mock'

export interface FaultProxyOptions {
  /** Whether the whole stack is up, for READY_PATH. */
  isReady?: () => boolean
  /** Empties the mock's stores, for RESET_MOCK_PATH. */
  resetMock?: () => Promise<void>
}

interface ActiveRule extends FaultRule {
  pattern: RegExp
  hits: number
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

export function createFaultProxy(
  target: { host: string; port: number },
  { isReady = () => true, resetMock }: FaultProxyOptions = {}
) {
  let rules: ActiveRule[] = []
  const held = new Set<http.ServerResponse>()

  function matchRule(req: http.IncomingMessage): ActiveRule | undefined {
    // CORS preflights always pass, so the browser reaches the faulted request
    if (req.method === 'OPTIONS') return undefined
    const path = new URL(req.url ?? '/', 'http://proxy').pathname
    const rule = rules.find(
      (candidate) =>
        candidate.pattern.test(path) &&
        (!candidate.method || candidate.method.toUpperCase() === req.method) &&
        (candidate.times === undefined || candidate.hits < candidate.times)
    )
    if (rule) rule.hits++
    return rule
  }

  async function handleControl(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    if (req.method === 'GET') {
      return sendJson(
        res,
        200,
        rules.map(({ pattern: _pattern, ...rule }) => rule)
      )
    }
    if (req.method === 'DELETE') {
      rules = []
      for (const pending of held) pending.destroy()
      held.clear()
      res.writeHead(204)
      return res.end()
    }
    if (req.method === 'POST') {
      try {
        const rule = JSON.parse(await readBody(req)) as FaultRule
        rules.push({ ...rule, pattern: new RegExp(rule.path), hits: 0 })
        return sendJson(res, 201, rule)
      } catch (error) {
        return sendJson(res, 400, { error: String(error) })
      }
    }
    res.writeHead(405)
    res.end()
  }

  function forward(req: http.IncomingMessage, res: http.ServerResponse) {
    const upstream = http.request(
      {
        host: target.host,
        port: target.port,
        method: req.method,
        path: req.url,
        headers: { ...req.headers, host: `${target.host}:${target.port}` },
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
        upstreamRes.pipe(res)
      }
    )
    upstream.on('error', (error) => {
      if (!res.headersSent) sendJson(res, 502, { error: error.message })
      else res.destroy()
    })
    req.pipe(upstream)
  }

  function fail(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    rule: ActiveRule
  ) {
    // Keep CORS working so the browser sees the injected status, not a CORS error
    const origin = req.headers.origin
    res.writeHead(rule.status ?? 500, {
      'content-type': 'application/json',
      ...(origin && {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
      }),
    })
    res.end(JSON.stringify(rule.body ?? { message: 'Injected by fault proxy' }))
  }

  return http.createServer((req, res) => {
    if (req.url === READY_PATH) {
      res.writeHead(isReady() ? 200 : 503)
      res.end()
      return
    }
    if (req.url === RESET_MOCK_PATH && req.method === 'POST') {
      if (!resetMock) {
        sendJson(res, 501, { error: 'no mock reset in this stack' })
        return
      }
      resetMock().then(
        () => {
          res.writeHead(204)
          res.end()
        },
        (error) => sendJson(res, 500, { error: String(error) })
      )
      return
    }
    if (req.url?.startsWith(FAULTS_PATH)) {
      void handleControl(req, res)
      return
    }

    const rule = matchRule(req)
    if (!rule) {
      forward(req, res)
      return
    }
    if (rule.hang) {
      held.add(res)
      res.on('close', () => held.delete(res))
      return
    }

    const failOrForward = () =>
      rule.status === undefined && rule.delayMs !== undefined
        ? forward(req, res)
        : fail(req, res, rule)
    if (rule.delayMs) setTimeout(failOrForward, rule.delayMs)
    else failOrForward()
  })
}
