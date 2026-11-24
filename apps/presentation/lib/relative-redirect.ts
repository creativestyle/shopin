import { NextResponse } from 'next/server'

// One leading slash, then printable ASCII only; no backslash anywhere
const SAFE_RELATIVE_LOCATION = /^\/(?![/\\])[!-[\]-~]*$/

/** True when a browser resolves the location against the requested host. */
function isSafeRelativeLocation(location: string): boolean {
  return SAFE_RELATIVE_LOCATION.test(location)
}

/** 307 with a path-only Location; anything that could leave the host falls back to `/`. */
export function relativeRedirect(location: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: isSafeRelativeLocation(location) ? location : '/',
    },
  })
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** Percent-encodes each path segment; already-encoded input is not double-encoded. */
export function encodePathSegments(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(safeDecode(segment)))
    .join('/')
}
