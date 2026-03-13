import { getMigrationFilePath } from './discovery'
import type { ContentfulEnv } from './env'
import type { MigrationEntry } from './discovery'
import { runMigration } from 'contentful-migration/built/bin/cli'

/**
 * Runs all migrations in-process using contentful-migration's runMigration.
 * Token is only read from env (CONTENTFUL_MANAGEMENT_ACCESS_TOKEN); nothing is
 * passed via process args, so it is not exposed in ps -ax.
 */
export async function runMigrations(
  entriesToRun: MigrationEntry[],
  autoConfirm: boolean,
  env: ContentfulEnv,
  paths: { migrationsDir: string; packageRoot: string }
): Promise<boolean> {
  const { spaceId, environmentId, managementToken } = env

  // Ensure migration scripts see the token via env (same process)
  process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN = managementToken
  process.env.CONTENTFUL_SPACE = spaceId
  process.env.CONTENTFUL_ENVIRONMENT = environmentId

  for (const entry of entriesToRun) {
    const filePath = getMigrationFilePath(
      paths.migrationsDir,
      entry.relativePath
    )
    console.log(`  Running ${entry.relativePath}…`)
    try {
      await runMigration({
        filePath,
        spaceId,
        environmentId,
        accessToken: managementToken,
        yes: autoConfirm,
      })
    } catch (err) {
      console.error(
        `\n❌ Migration failed: ${entry.relativePath}`,
        err instanceof Error ? err.message : err
      )
      return false
    }
  }
  return true
}
