export type BffFetchClient = {
  fetch: (path: string, options?: RequestInit) => Promise<Response>
}
