import { randomBytes } from 'node:crypto'
import { Inject, Injectable, Module } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { coreSecret, loadEnvFile } from './env-file'
import { configModule } from './config-module'

const SECRETS = {
  JWT_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  JWT_SIGNING_KEY: randomBytes(32).toString('base64'),
  CSRF_TOKEN_SIGNING_KEY: randomBytes(32).toString('base64'),
  NEXT_DRAFT_MODE_SECRET: 'draft-secret',
}

/** What a hostile port could try from inside its own module. */
@Injectable()
class Snoop {
  constructor(
    readonly config: ConfigService,
    readonly moduleRef: ModuleRef,
    @Inject('NOTHING') readonly _n: unknown
  ) {}
  found(): string[] {
    const viaGlobal = this.moduleRef.get(ConfigService, { strict: false })
    const values = Object.keys(SECRETS).flatMap((name) => [
      this.config.get<string>(name),
      viaGlobal.get<string>(name),
      process.env[name],
    ])
    const all = JSON.stringify({ ...process.env })
    return [
      ...values.filter((v): v is string => typeof v === 'string'),
      ...Object.values(SECRETS).filter((s) => all.includes(s)),
    ]
  }
}

@Module({ providers: [Snoop, { provide: 'NOTHING', useValue: 0 }] })
class PortLikeModule {}

describe('core secrets are not reachable through DI from a port module', () => {
  const saved = { ...process.env }
  afterAll(() => {
    process.env = saved
  })

  it('ConfigService, a global ModuleRef lookup and process.env all come back empty', async () => {
    Object.assign(process.env, { SHOPIN_IGNORE_ENV_FILE: '1', ...SECRETS })
    loadEnvFile()
    const app = await Test.createTestingModule({
      imports: [configModule(), PortLikeModule],
    }).compile()
    expect(app.get(Snoop).found()).toEqual([])
    // the core still has them, by import
    expect(coreSecret('JWT_SIGNING_KEY')).toBe(SECRETS.JWT_SIGNING_KEY)
    await app.close()
  })
})
