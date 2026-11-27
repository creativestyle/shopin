/**
 * `node main.js` with a broken environment: the BFF stops with one plain message (every problem, where the
 * variables are documented) and no Node stack, exit code 1.
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

it('a configuration problem stops the boot with a plain message, not a stack', () => {
  const run = spawnSync(
    process.execPath,
    ['-r', 'ts-node/register', join(__dirname, 'main.ts')],
    {
      cwd: join(__dirname, '..'),
      encoding: 'utf8',
      timeout: 60_000,
      env: {
        PATH: process.env.PATH,
        SHOPIN_IGNORE_ENV_FILE: '1',
        NODE_ENV: 'production',
        TS_NODE_TRANSPILE_ONLY: '1',
      },
    }
  )
  expect(run.status).toBe(1)
  expect(run.stderr).toMatch(/^BFF: cannot start:\n/)
  expect(run.stderr).toMatch(/missing core secrets: JWT_ENCRYPTION_KEY/)
  expect(run.stderr).toMatch(/FRONTEND_URL is not set/)
  expect(run.stderr).toMatch(/BFF_SESSION_REVOCATIONS_FILE is not set/)
  expect(run.stderr).toMatch(/\.env\.example/)
  expect(run.stderr).not.toMatch(/^\s+at /m)
}, 70_000)

it('a port that throws while the BFF builds it stops the boot with the same plain message, not a stack', () => {
  const run = spawnSync(
    process.execPath,
    [
      '-r',
      'ts-node/register',
      '-r',
      join(__dirname, '../test/boot-error-preload.js'),
      join(__dirname, 'main.ts'),
    ],
    {
      cwd: join(__dirname, '..'),
      encoding: 'utf8',
      timeout: 60_000,
      env: {
        PATH: process.env.PATH,
        SHOPIN_IGNORE_ENV_FILE: '1',
        TS_NODE_TRANSPILE_ONLY: '1',
        PORT: '0',
        ...Object.fromEntries(
          [
            'JWT_ENCRYPTION_KEY',
            'JWT_SIGNING_KEY',
            'CSRF_TOKEN_ENCRYPTION_KEY',
            'CSRF_TOKEN_SIGNING_KEY',
          ].map((k) => [k, Buffer.alloc(32, 1).toString('base64')])
        ),
      },
    }
  )
  expect(run.status).toBe(1)
  expect(run.stderr).toMatch(/^BFF: cannot start:\n/)
  expect(run.stderr).toMatch(/broken: no store key for fr-FR/)
  expect(run.stderr).not.toMatch(/^\s+at /m)
}, 70_000)
