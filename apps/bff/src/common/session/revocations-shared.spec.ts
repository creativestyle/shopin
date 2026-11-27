/**
 * More than one BFF instance, no Redis: the instances share one revocation file (an Upsun network-storage mount).
 * Two separate Node processes stand for two BFF instances: a logout on one is refused on the other, and revocations
 * written by both at the same time are all kept.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const MODULE = join(__dirname, 'revocations.ts')
const DAY = 24 * 60 * 60 * 1000

/** One BFF instance: a Node process with its own RevocationList over `file`, driven by `script`. */
function instance(file: string, script: string): Promise<string> {
  const code = `(async () => {
    const { RevocationList } = require(${JSON.stringify(MODULE)})
    const list = new RevocationList(${30 * DAY}, () => ${JSON.stringify(file)})
    list.load()
    const out = []
    ${script}
    console.log(JSON.stringify(out))
  })().catch((e) => { console.error(e); process.exit(1) })`
  return new Promise((resolve, reject) => {
    // the BFF's own TypeScript, transpiled on load (ts-node), as `nest start` runs it
    const p = spawn(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', '-e', code],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )
    let stdout = ''
    let stderr = ''
    p.stdout.on('data', (d) => (stdout += d))
    p.stderr.on('data', (d) => (stderr += d))
    p.on('close', (code) =>
      code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr))
    )
  })
}

describe('revocations shared by several BFF instances', () => {
  const dir = mkdtempSync(join(tmpdir(), 'revocations-shared-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('a session signed out on one instance is refused on the other, which was already running', async () => {
    const file = join(dir, 'one.json')
    const marker = (name: string) => JSON.stringify(`${file}.${name}`)
    // B starts first and checks (the file does not exist yet), then says so; only then does A sign the session
    // out. B checks again after its next look at the file is due (at most once a second). No step depends on how
    // fast a process starts.
    const b = instance(
      file,
      `const { existsSync, writeFileSync } = require('node:fs')
       const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
       out.push(list.isRevoked({ sid: 's-1' }))
       writeFileSync(${marker('ready')}, '')
       while (!existsSync(${marker('go')})) await sleep(20)
       await sleep(1100)
       out.push(list.isRevoked({ sid: 's-1' }))`
    )
    while (!existsSync(`${file}.ready`)) {
      await new Promise((r) => setTimeout(r, 20))
    }
    await instance(file, `list.revoke('s-1')`)
    writeFileSync(`${file}.go`, '')
    expect(JSON.parse(await b)).toEqual([false, true])
  }, 60_000)

  it('revocations written by two instances at the same time are all kept', async () => {
    const file = join(dir, 'two.json')
    const many = (prefix: string) =>
      `for (let i = 0; i < 100; i++) list.revoke('${prefix}-' + i)`
    await Promise.all([instance(file, many('a')), instance(file, many('b'))])
    const check = await instance(
      file,
      `for (const p of ['a', 'b']) for (let i = 0; i < 100; i++) out.push(list.isRevoked({ sid: p + '-' + i }))`
    )
    expect(JSON.parse(check)).toEqual(new Array(200).fill(true))
  }, 60_000)
})
