/** The switch in the real BFF, through the framework's scenario harness (@test/category-split, condition shopin-test). */
module.exports = {
  rootDir: __dirname,
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: __dirname + '/tsconfig.json' }],
  },
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['shopin-test', 'node', 'require', 'default'],
  },
  transformIgnorePatterns: ['/node_modules/', '/dist/'],
}
