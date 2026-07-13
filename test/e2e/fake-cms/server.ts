/**
 * Minimal HTTP server that acts as a "CMS" at a different origin (FAKE_CMS_PORT)
 * for the cross-origin iframe preview test.
 *
 * GET /preview?url=<encodedPreviewUrl>
 *   Returns an HTML page that embeds <encodedPreviewUrl> in an <iframe>.
 *   The iframe is from origin localhost:3000 while the CMS page is from
 *   localhost:FAKE_CMS_PORT, exercising the cross-origin embedding scenario.
 */

import http from 'node:http'

function html(res: http.ServerResponse, body: string) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(body)
}

function createFakeCmsHandler(): http.RequestListener {
  return (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost`)
    if (url.pathname === '/preview') {
      const previewUrl = url.searchParams.get('url') ?? ''
      return html(
        res,
        `<!DOCTYPE html>
<html>
<head><title>Fake CMS Preview</title></head>
<body>
  <h1>CMS Preview</h1>
  <iframe
    id="preview-frame"
    src="${previewUrl.replace(/"/g, '&quot;')}"
    width="1200"
    height="800"
    style="border:none"
  ></iframe>
</body>
</html>`
      )
    }
    res.writeHead(404)
    res.end('Not found')
  }
}

let _server: http.Server | null = null

export function getFakeCmsServer(): http.Server {
  if (!_server) {
    _server = http.createServer(createFakeCmsHandler())
  }
  return _server
}
