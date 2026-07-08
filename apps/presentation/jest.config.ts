import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
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
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.(svg)$': '<rootDir>/__mocks__/svg.tsx',
  },
}

export default createJestConfig(config)
