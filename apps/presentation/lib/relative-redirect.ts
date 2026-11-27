import { NextResponse } from 'next/server'
import { isSafeRelativePath } from './safe-relative-path'

/** 307 with a path-only Location; anything that could leave the host falls back to `/`. */
export function relativeRedirect(location: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: isSafeRelativePath(location) ? location : '/',
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
