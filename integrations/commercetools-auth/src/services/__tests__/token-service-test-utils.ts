import { CommercetoolsErrorMatcher } from '../../utils/commercetools-error-matcher'

export const TOKEN_NOT_FOUND = {
  statusCode: 404,
  body: { errors: [{ code: 'ResourceNotFound' }] },
}

export function createTokenServiceDeps(
  endpoint: 'emailConfirm' | 'passwordReset',
  execute: jest.Mock
) {
  const post = jest.fn().mockReturnValue({ execute })
  const client = { customers: () => ({ [endpoint]: () => ({ post }) }) }
  const serverClientService = { getClient: () => client }
  const logger = { setContext: jest.fn(), error: jest.fn() }
  return {
    args: [
      serverClientService as never,
      logger as never,
      new CommercetoolsErrorMatcher(),
    ] as const,
    logger,
  }
}
