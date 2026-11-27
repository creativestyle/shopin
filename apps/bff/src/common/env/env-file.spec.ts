import { coreSecret, frontendUrl, loadEnvFile, partEnv } from './env-file'

describe('core secrets and port variables leave process.env before any port loads', () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it('keeps secrets in a core-only map and every non-core variable out of process.env', () => {
    process.env.SHOPIN_IGNORE_ENV_FILE = '1'
    process.env.JWT_SIGNING_KEY = 'jwt'
    process.env.CSRF_TOKEN_SIGNING_KEY = 'csrf'
    process.env.SESSION_SECRET = 'session'
    process.env.NEXT_DRAFT_MODE_SECRET = 'draft'
    process.env.FRONTEND_URL = 'http://shop.example'
    process.env.ACME_TOKEN = 'acme'
    process.env.UNDECLARED_VENDOR_KEY = 'stray'
    {
      loadEnvFile()
      // what a port (or an SDK in the same process) can still read
      expect([
        process.env.JWT_SIGNING_KEY,
        process.env.CSRF_TOKEN_SIGNING_KEY,
        process.env.SESSION_SECRET,
        process.env.NEXT_DRAFT_MODE_SECRET,
        process['env']['ACME_TOKEN'],
        process.env.UNDECLARED_VENDOR_KEY,
      ]).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ])
      expect(coreSecret('JWT_SIGNING_KEY')).toBe('jwt')
      expect(coreSecret('NEXT_DRAFT_MODE_SECRET')).toBe('draft')
      // a port asking for a core variable by name gets nothing; its own variable is handed over once
      expect(partEnv('JWT_SIGNING_KEY')).toBeUndefined()
      expect(partEnv('FRONTEND_URL')).toBeUndefined()
      expect(partEnv('PATH')).toBeUndefined()
      expect(partEnv('ACME_TOKEN')).toBe('acme')
      // non-secret core and system variables stay for the core
      expect(process.env.FRONTEND_URL).toBe('http://shop.example')
      expect(process.env.PATH).toBe(saved.PATH)
    }
  })
})

describe("the storefront's origin", () => {
  it('has a local default only outside production', () => {
    expect(frontendUrl({ FRONTEND_URL: 'https://shop.example' })).toBe(
      'https://shop.example'
    )
    expect(frontendUrl({ NODE_ENV: 'development' })).toBe(
      'http://localhost:3000'
    )
    expect(() => frontendUrl({ NODE_ENV: 'production' })).toThrow(
      /FRONTEND_URL is not set/
    )
  })
})
