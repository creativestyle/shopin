import { NextResponse } from 'next/server'

/** 307 with a path-only Location, resolved by the browser against the host it requested. */
export function relativeRedirect(location: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: location },
  })
}
