/** Category split and coupling hunt: scenario tests that boot the real BFF AppModule (no listen()). */
module.exports = {
  rootDir: __dirname,
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: __dirname + "/tsconfig.json" }],
  },
  testEnvironment: "node",
  // the BFF's sources are exported to tests only (@apps/bff/src/*, condition shopin-test)
  testEnvironmentOptions: {
    customExportConditions: ["shopin-test", "node", "require", "default"],
  },
  transformIgnorePatterns: ["/node_modules/", "/dist/"],
};
