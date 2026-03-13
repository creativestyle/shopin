const fs = require("fs");

const commitMessageFile = process.argv[2];

try {
  const commitMessage = fs.readFileSync(commitMessageFile, "utf8");
  const commitHeader = commitMessage
    .split("\n")
    .find((line) => !line.startsWith("#"))
    ?.trim();

  const commitPattern =
    /^(build|ci|docs|feat|fix|perf|refactor|test)(\(.+\))?!?: (\.+|[^\[\]].+)/;

  if (!commitPattern.test(commitHeader)) {
    console.log("\x1b[41m ERROR \x1b[0m Invalid commit message format");
    console.log(`
  Commit message:
    \x1b[31m${commitHeader || "<empty commit message>"}\x1b[0m

  Correct format:
                                  ┌─⫸ Commit header.
    ┌─────────────────────────────┴────────────────────────────┐
    <type>(<scope>)<exclamation mark>: <summary>
    └─┬──┘└───┬───┘└───────┬────────┘  └───┬───┘
      │       │            │               └─⫸ Summary in present tense. Not capitalized.
      │       │            │                    No period at the end.
      │       │            │                 
      │       │            │                  
      │       │            │
      │       │            └─⫸ Exclamation mark (!) for commits that introduce a breaking change.
      │       │
      │       └─⫸ Scope of the codebase. Enclosed in parentheses.
      │
      └─⫸ Type: build|ci|docs|feat|fix|perf|refactor|test

    <body>
    └─┬──┘
      └─⫸ Commit body providing additional contextual information.

    <footer>
    └─┬────┘
      └─⫸ Commit footer providing meta-information related to the commit.
    `);

    process.exit(1);
  }
} catch (error) {
  console.log("\x1b[43m WARNING \x1b[0m Could not validate commit message");
}
