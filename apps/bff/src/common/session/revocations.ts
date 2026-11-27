import { randomUUID } from 'node:crypto'
import {
  closeSync,
  linkSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { dirname } from 'node:path'

/** A few milliseconds of synchronous wait while another instance holds the file's lock. */
const pause = (ms: number) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
/** A lock older than this was left by an instance that died while writing. */
const STALE_LOCK_MS = 5_000
/** How often a check looks at the file again (one `stat` per process per interval, not one per request). */
const REFRESH_MS = 1_000

const codeOf = (error: unknown) => (error as { code?: string }).code

/**
 * Takes over a lock left by a dead instance: `seen` is the token read from the stale lock. The lock is moved away
 * by an atomic rename, so of two instances that both found it stale only one moves it; the other moves nothing
 * (ENOENT) or the new owner's fresh lock, which it puts back (a hard link never replaces a lock that exists).
 * True when this caller removed the stale lock (it then competes for the lock like any instance).
 */
export function takeStaleLock(lock: string, seen: string): boolean {
  const moved = `${lock}.${randomUUID()}.stale`
  try {
    renameSync(lock, moved)
  } catch (error) {
    if (codeOf(error) === 'ENOENT') {
      return false
    }
    throw error
  }
  const stale = readFileSync(moved, 'utf8') === seen
  if (!stale) {
    try {
      linkSync(moved, lock)
    } catch (error) {
      if (codeOf(error) !== 'EEXIST') {
        throw error
      }
    }
  }
  rmSync(moved, { force: true })
  return stale
}

/**
 * Why the revocation file cannot be used, or undefined: its folder must take a new file (the lock and every write
 * create one). Checked at boot, so a read-only or missing mount stops the start instead of the first logout.
 */
export function revocationFileProblem(file: string): string | undefined {
  const probe = `${file}.${randomUUID()}.probe`
  try {
    closeSync(openSync(probe, 'wx'))
    rmSync(probe, { force: true })
    return undefined
  } catch (error) {
    return `BFF_SESSION_REVOCATIONS_FILE=${file}: its folder ${dirname(file)} is not writable (${codeOf(error) ?? String(error)}); every BFF instance needs to write there (a persistent, shared mount)`
  }
}

interface Saved {
  sessions: [string, number][]
  identities: [string, { before: number; until: number }][]
}

/** Which write of the file this is: a new inode per write (rename), its mtime and size. */
const versionOf = (file: string) => {
  const s = statSync(file)
  return `${s.ino}:${s.mtimeMs}:${s.size}`
}

/**
 * Server-side session revocation. A session cookie is self-contained, so signing out, changing or resetting the
 * password must also make copies of it useless:
 * - `revoke(sid)`: one session (logout);
 * - `revokeIdentity(key, before)`: every session of an identity issued up to `before` (password change, reset).
 * Entries expire after the session's idle lifetime, when the cookie is dead anyway.
 *
 * With `file` (resolved on first use, after the BFF has read its environment), every change is written to that
 * file (atomically) and read back at start-up, so a revocation survives a restart or a deploy. Several BFF
 * instances share one file on shared storage (a network-storage mount): each reads it again when its
 * modification time changes, and writes under an exclusive lock file after merging it, so no instance drops another's
 * revocation.
 */
export class RevocationList {
  private readonly sessions = new Map<string, number>()
  private readonly identities = new Map<
    string,
    { before: number; until: number }
  >()

  private file: string | undefined
  private loaded = false
  /** The file as this process last read or wrote it: inode (each write renames a new file over it) and mtime. */
  private seen = ''
  /** When this process last looked at the file (`isRevoked` looks at most once per REFRESH_MS). */
  private looked = -Infinity

  constructor(
    private readonly ttlMs: number,
    private readonly fileOf: () => string | undefined = () => undefined,
    /** A read of the store failed while checking a session (logged by the BFF; the last loaded list stays). */
    private readonly onReadError: (error: unknown) => void = (error) =>
      console.error('session revocations: could not read the store', error)
  ) {}

  /** Reads the file once (and fails loudly when production has none). The BFF calls it at boot. */
  load(): void {
    if (this.loaded) {
      return
    }
    this.loaded = true
    this.file = this.fileOf()
    this.refresh()
  }

  revoke(sid: string, now = Date.now()): void {
    this.load()
    this.change(now, () => this.sessions.set(sid, now + this.ttlMs))
  }

  revokeIdentity(key: string, before: number, now = Date.now()): void {
    this.load()
    this.change(now, () =>
      this.identities.set(key, { before, until: now + this.ttlMs })
    )
  }

  isRevoked(
    session: { sid?: string; iat?: number; identityKey?: string },
    now = Date.now()
  ): boolean {
    this.load()
    const clock = Date.now()
    if (clock - this.looked >= REFRESH_MS) {
      this.looked = clock
      try {
        this.refresh()
      } catch (error) {
        // the store could not be read this time (a network mount's ESTALE, EIO, a permission): the list stays as
        // last loaded and the next check reads again; a storage hiccup never signs every shopper out
        this.onReadError(error)
      }
    }
    if (session.sid && (this.sessions.get(session.sid) ?? 0) > now) {
      return true
    }
    const identity = session.identityKey
      ? this.identities.get(session.identityKey)
      : undefined
    return Boolean(
      identity && identity.until > now && (session.iat ?? 0) <= identity.before
    )
  }

  /** Merges the file into memory when another instance changed it since this one last looked (one stat). */
  private refresh(): void {
    if (!this.file) {
      return
    }
    let version: string
    try {
      version = versionOf(this.file)
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return
      }
      throw error
    }
    if (version === this.seen) {
      return
    }
    const saved = JSON.parse(readFileSync(this.file, 'utf8')) as Saved
    this.seen = version
    for (const [k, v] of saved.sessions ?? []) {
      this.sessions.set(k, Math.max(v, this.sessions.get(k) ?? 0))
    }
    for (const [k, v] of saved.identities ?? []) {
      const mine = this.identities.get(k)
      this.identities.set(
        k,
        mine
          ? {
              before: Math.max(mine.before, v.before),
              until: Math.max(mine.until, v.until),
            }
          : v
      )
    }
  }

  /**
   * One revocation, under the file's lock (`<file>.lock`, created exclusively, so two instances never write at the
   * same time): merge what the other instances wrote, apply it, write.
   */
  private change(now: number, apply: () => void): void {
    if (!this.file) {
      apply()
      this.prune(now)
      return
    }
    this.locked(this.file, (stillOwned) => {
      this.refresh()
      apply()
      this.prune(now)
      this.save(stillOwned)
    })
  }

  private locked(
    file: string,
    write: (stillOwned: () => boolean) => void
  ): void {
    const lock = `${file}.lock`
    // the lock holds its owner's token: a takeover can tell a stale lock from a fresh one
    const token = `${process.pid}:${randomUUID()}`
    const started = Date.now()
    for (;;) {
      try {
        const fd = openSync(lock, 'wx')
        writeSync(fd, token)
        closeSync(fd)
        break
      } catch (error) {
        if (codeOf(error) !== 'EEXIST') {
          throw error
        }
      }
      let seen: string
      let age: number
      try {
        seen = readFileSync(lock, 'utf8')
        age = Date.now() - statSync(lock).mtimeMs
      } catch {
        continue // released in between
      }
      if (age > STALE_LOCK_MS) {
        takeStaleLock(lock, seen)
        continue
      }
      if (Date.now() - started > 2 * STALE_LOCK_MS) {
        throw new Error(`the revocation file ${file} stays locked (${lock})`)
      }
      pause(5)
    }
    try {
      write(() => {
        try {
          return readFileSync(lock, 'utf8') === token
        } catch {
          return false
        }
      })
    } finally {
      // only its own lock: after a takeover the lock may be another instance's
      try {
        if (readFileSync(lock, 'utf8') === token) {
          rmSync(lock, { force: true })
        }
      } catch {
        // already gone
      }
    }
  }

  private prune(now: number): void {
    for (const [k, until] of this.sessions) {
      if (until <= now) {
        this.sessions.delete(k)
      }
    }
    for (const [k, v] of this.identities) {
      if (v.until <= now) {
        this.identities.delete(k)
      }
    }
  }

  /** Writes the file atomically (a new file renamed over it); the caller holds the lock. */
  /**
   * Writes the list: a temp file of its own (a random name, never shared with another writer), then an atomic rename,
   * but only while this writer still holds the lock (a stale-lock takeover may have handed it to another instance
   * meanwhile; then nothing is written and the revocation fails loudly instead of overwriting the other's).
   */
  private save(stillOwned: () => boolean): void {
    const file = this.file!
    const saved: Saved = {
      sessions: [...this.sessions],
      identities: [...this.identities],
    }
    const tmp = `${file}.${randomUUID()}.tmp`
    writeFileSync(tmp, JSON.stringify(saved))
    if (!stillOwned()) {
      rmSync(tmp, { force: true })
      throw new Error(
        `the revocation file ${file} was taken over by another instance while writing`
      )
    }
    renameSync(tmp, file)
    this.seen = versionOf(file)
  }
}

/**
 * Where revocations are kept: `BFF_SESSION_REVOCATIONS_FILE` (a path on persistent storage). Production refuses
 * to start without it, because an in-memory list forgets every logout on the next deploy.
 */
export function revocationFile(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  const file = env.BFF_SESSION_REVOCATIONS_FILE?.trim() || undefined
  if (!file && env.NODE_ENV === 'production') {
    throw new Error(
      'BFF_SESSION_REVOCATIONS_FILE is not set: in production, logout and password changes must be remembered across restarts (a path on persistent storage)'
    )
  }
  return file
}
