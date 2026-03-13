export interface ContentfulEnv {
  spaceId: string
  environmentId: string
  managementToken: string
}

export function requireEnv(): ContentfulEnv {
  const spaceId = process.env.CONTENTFUL_SPACE
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT
  const managementToken = process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
  if (!spaceId || !environmentId || !managementToken) {
    throw new Error(
      'Missing required env: CONTENTFUL_SPACE, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_ACCESS_TOKEN. ' +
        'Load .env (e.g. dotenv -e ../../.env -- node dist/run-migrations.js migrate).'
    )
  }
  return { spaceId, environmentId, managementToken }
}
