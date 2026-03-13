const { execSync } = require("child_process");

try {
  const changedFiles = execSync("git diff-tree -r --name-only --no-commit-id HEAD@{1} HEAD", {
    encoding: "utf8",
  });

  if (changedFiles.includes("package-lock.json")) {
    console.log("Installing dependencies");
    execSync("npm ci", { stdio: "inherit" });
  }
} catch {
  // Install dependencies if the command fails, just in case
  console.log("Installing dependencies");
  execSync("npm ci", { stdio: "inherit" });
}
