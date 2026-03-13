import { getBffClientUrl } from '../core/bff-utils-client'
import { getBffServerUrl } from '../core/bff-utils-server'

describe('bff-utils', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })

  it('getBffClientUrl returns internal URL when available', () => {
    process.env.NEXT_BFF_INTERNAL_URL = 'http://bff-internal'
    process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL = 'https://ext.example.com'
    expect(getBffClientUrl()).toBe('http://bff-internal')
  })

  it('getBffClientUrl returns external URL when internal URL not available', () => {
    delete process.env.NEXT_BFF_INTERNAL_URL
    process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL = 'https://ext.example.com'
    expect(getBffClientUrl()).toBe('https://ext.example.com')
  })

  it('getBffClientUrl returns empty string when missing', () => {
    delete process.env.NEXT_BFF_INTERNAL_URL
    delete process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL
    expect(getBffClientUrl()).toBe('')
  })

  it('getBffServerUrl returns env var', async () => {
    process.env.NEXT_BFF_INTERNAL_URL = 'http://bff-internal'
    await expect(getBffServerUrl()).resolves.toBe('http://bff-internal')
  })

  it('getBffServerUrl throws when missing', async () => {
    delete process.env.NEXT_BFF_INTERNAL_URL
    await expect(getBffServerUrl()).rejects.toThrow()
  })
})
