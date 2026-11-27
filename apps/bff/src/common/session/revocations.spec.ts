import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { RevocationList, revocationFile, takeStaleLock } from './revocations'
import { coreEnvProblems, loadEnvFile } from '../env/env-file'

const DAY = 24 * 60 * 60 * 1000

describe('session revocations survive a restart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'revocations-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('a logout and a password change revoked before a restart stay revoked after it', () => {
    const file = join(dir, 'revocations.json')
    const before = new RevocationList(30 * DAY, () => file)
    before.revoke('sid-logged-out')
    before.revokeIdentity('idp:u-1', 1_000)
    // a new process reads the same file
    const after = new RevocationList(30 * DAY, () => file)
    expect(after.isRevoked({ sid: 'sid-logged-out' })).toBe(true)
    expect(
      after.isRevoked({ sid: 'other', iat: 999, identityKey: 'idp:u-1' })
    ).toBe(true)
    expect(
      after.isRevoked({ sid: 'other', iat: 1_001, identityKey: 'idp:u-1' })
    ).toBe(false)
    expect(after.isRevoked({ sid: 'still-valid' })).toBe(false)
  })

  it('production refuses to start without persistent storage for revocations', () => {
    expect(() => revocationFile({ NODE_ENV: 'production' })).toThrow(
      /BFF_SESSION_REVOCATIONS_FILE is not set/
    )
    expect(
      revocationFile({
        NODE_ENV: 'production',
        BFF_SESSION_REVOCATIONS_FILE: '/data/r.json',
      })
    ).toBe('/data/r.json')
    expect(revocationFile({ NODE_ENV: 'development' })).toBeUndefined()
  })

  it("a stale lock is taken over by one instance only: the second finds the winner's fresh lock and keeps it", () => {
    const lock = join(dir, 'race.json.lock')
    writeFileSync(lock, 'dead-instance')
    const old = new Date(Date.now() - 60_000)
    utimesSync(lock, old, old)
    // both instances read the stale lock's token; the first takes it over and locks again
    expect(takeStaleLock(lock, 'dead-instance')).toBe(true)
    expect(existsSync(lock)).toBe(false)
    writeFileSync(lock, 'winner')
    // the second, a moment later, must not remove the winner's lock
    expect(takeStaleLock(lock, 'dead-instance')).toBe(false)
    expect(readFileSync(lock, 'utf8')).toBe('winner')
    // and no moved copy is left behind
    expect(
      readdirSync(dir).filter((f) => f.startsWith('race.json.lock.'))
    ).toEqual([])
  })

  it("a dead instance's lock does not block a revocation", () => {
    const file = join(dir, 'stale.json')
    writeFileSync(`${file}.lock`, 'dead-instance')
    const old = new Date(Date.now() - 60_000)
    utimesSync(`${file}.lock`, old, old)
    new RevocationList(30 * DAY, () => file).revoke('after-crash')
    expect(
      new RevocationList(30 * DAY, () => file).isRevoked({ sid: 'after-crash' })
    ).toBe(true)
    expect(existsSync(`${file}.lock`)).toBe(false)
  })

  it('a lock taken over while this instance writes: nothing is written over the new owner, the revocation fails', () => {
    const sub = mkdtempSync(join(dir, 'takeover-'))
    const file = join(sub, 'revocations.json')
    const theirs = JSON.stringify({
      sessions: [['their-sid', Date.now() + DAY]],
      identities: [],
    })
    const list = new RevocationList(30 * DAY, () => file)
    const realWrite = fs.writeFileSync
    // while this instance writes its temp file, another one takes the lock over (stale-lock takeover) and saves
    const write = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation((path, data, options) => {
        realWrite(path, data, options)
        if (String(path).endsWith('.tmp')) {
          realWrite(`${file}.lock`, 'another-instance')
          realWrite(file, theirs)
        }
      })
    try {
      expect(() => list.revoke('my-sid')).toThrow(/taken over/)
    } finally {
      write.mockRestore()
    }
    // the other writer's list stands, and its lock stays
    expect(readFileSync(file, 'utf8')).toBe(theirs)
    expect(readFileSync(`${file}.lock`, 'utf8')).toBe('another-instance')
    // no temp file left behind
    expect(readdirSync(sub).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })

  it('a check looks at the file at most once a second (one stat per process, not per request)', () => {
    const file = join(dir, 'throttle.json')
    const a = new RevocationList(30 * DAY, () => file)
    const b = new RevocationList(30 * DAY, () => file)
    const clock = jest.spyOn(Date, 'now')
    try {
      clock.mockReturnValue(1_000_000)
      expect(b.isRevoked({ sid: 's' }, Date.now())).toBe(false)
      a.revoke('s', Date.now())
      // within the second: b has not looked again
      clock.mockReturnValue(1_000_500)
      expect(b.isRevoked({ sid: 's' }, Date.now())).toBe(false)
      // a second later it has
      clock.mockReturnValue(1_001_000)
      expect(b.isRevoked({ sid: 's' }, Date.now())).toBe(true)
    } finally {
      clock.mockRestore()
    }
  })

  it("the boot stops when the revocation file's folder is not writable", () => {
    process.env.SHOPIN_IGNORE_ENV_FILE = '1'
    loadEnvFile()
    const readOnly = join(dir, 'read-only')
    mkdirSync(readOnly)
    chmodSync(readOnly, 0o500)
    try {
      for (const file of [
        join(readOnly, 'r.json'),
        join(dir, 'missing', 'r.json'),
      ]) {
        expect(
          coreEnvProblems({
            NODE_ENV: 'development',
            BFF_SESSION_REVOCATIONS_FILE: file,
          })
        ).toEqual(
          expect.arrayContaining([
            expect.stringMatching(
              /^BFF_SESSION_REVOCATIONS_FILE=.*is not writable/
            ),
          ])
        )
      }
      expect(
        coreEnvProblems({
          NODE_ENV: 'development',
          BFF_SESSION_REVOCATIONS_FILE: join(dir, 'ok.json'),
        }).filter((p) => p.includes('REVOCATIONS'))
      ).toEqual([])
    } finally {
      chmodSync(readOnly, 0o700)
    }
  })
})

describe('a store that cannot be read while checking', () => {
  it('keeps the last loaded list (no shopper signed out by a storage hiccup) and reports the error', () => {
    const dir = mkdtempSync(join(tmpdir(), 'revocations-read-'))
    const file = join(dir, 'revocations.json')
    const errors: unknown[] = []
    const list = new RevocationList(
      30 * DAY,
      () => file,
      (e) => errors.push(e)
    )
    list.revoke('revoked-sid')
    expect(list.isRevoked({ sid: 'revoked-sid' })).toBe(true)
    // another writer left a garbled file (or the mount answers with an error) and the next look is due
    writeFileSync(file, '{ not json')
    utimesSync(file, new Date(), new Date(Date.now() + 60_000))
    const later = Date.now() + 10 * 60_000
    const now = jest.spyOn(Date, 'now').mockReturnValue(later)
    try {
      expect(() => list.isRevoked({ sid: 'other' }, later)).not.toThrow()
      expect(list.isRevoked({ sid: 'revoked-sid' }, later)).toBe(true)
      expect(list.isRevoked({ sid: 'fine-sid' }, later)).toBe(false)
      expect(errors).toHaveLength(1)
    } finally {
      now.mockRestore()
    }
  })
})
