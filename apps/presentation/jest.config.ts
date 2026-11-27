import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // next-intl subpath exports are ESM-only; swap with CJS shims for Jest.
    // Note: '^@/lib/navigation$' can't be used here — nextJest inserts '^@/(.*)$'
    // from tsconfig paths before user entries, so the specific mock is always shadowed.
    // Mocking next-intl/* directly is the reliable fix.
    '^next-intl/routing$': '<rootDir>/__mocks__/next-intl-routing.js',
    '^next-intl/navigation$': '<rootDir>/__mocks__/next-intl-navigation.js',
    // the shop's slots (config/storefront) are not part of the storefront's tests: none, see the fixture
    '^@shopin/storefront$': '<rootDir>/lib/__fixtures__/storefront-slots.ts',
    '^@shopin/storefront/wired$': '<rootDir>/lib/__fixtures__/wired-slots.ts',
    // its data (storefront-data.json): the fixture config's, so the tests pass whatever the shop configures
    '^@shopin/storefront/storefront-data\\.json$':
      '<rootDir>/lib/__fixtures__/storefront-data.ts',
    // the shop's locales (config/locales.json, copied into @config/constants) are not the tests' either
    '^\\./locales\\.json$': '<rootDir>/lib/__fixtures__/locales.json',
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.(svg)$': '<rootDir>/__mocks__/svg.tsx',
  },
}

export default createJestConfig(config)
