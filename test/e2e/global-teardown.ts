import { getFakeCmsServer } from './fake-cms/server'

export default async function globalTeardown() {
  await new Promise<void>((resolve) => getFakeCmsServer().close(() => resolve()))
}
