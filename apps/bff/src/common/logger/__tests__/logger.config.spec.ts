import type { IncomingMessage, ServerResponse } from 'http'
import { CORRELATION_ID_HEADER } from '@config/constants'
import { createLoggerConfig } from '../logger.config'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type GenReqId = (req: IncomingMessage, res: ServerResponse) => string

function genReqId(): GenReqId {
  const { pinoHttp } = createLoggerConfig()
  return (pinoHttp as { genReqId: GenReqId }).genReqId
}

function call(incomingId?: string) {
  const req = {
    headers: incomingId ? { [CORRELATION_ID_HEADER]: incomingId } : {},
  } as unknown as IncomingMessage
  const res = { setHeader: jest.fn() }
  const id = genReqId()(req, res as unknown as ServerResponse)
  return { id, setHeader: res.setHeader }
}

describe('createLoggerConfig genReqId', () => {
  it('echoes a valid incoming correlation id on the response', () => {
    const incoming = '3f1c2b7e-8a4d-4c1e-9b2a-6d5e4f3a2b1c'
    const { id, setHeader } = call(incoming)
    expect(id).toBe(incoming)
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, incoming)
  })

  it('generates a fresh id for an invalid incoming value', () => {
    const { id, setHeader } = call('not-a-uuid')
    expect(id).not.toBe('not-a-uuid')
    expect(id).toMatch(UUID_V4)
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, id)
  })

  it('generates a fresh id when no header is sent', () => {
    const { id, setHeader } = call()
    expect(id).toMatch(UUID_V4)
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, id)
  })
})
