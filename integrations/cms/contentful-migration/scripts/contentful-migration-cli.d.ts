declare module 'contentful-migration/built/bin/cli' {
  export function runMigration(argv: {
    filePath: string
    spaceId: string
    environmentId: string
    accessToken: string
    yes?: boolean
  }): Promise<void>
}
