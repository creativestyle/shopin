import { act, renderHook } from '@testing-library/react'
import {
  clearRegistrationCompleted,
  markRegistrationCompleted,
  useHasCompletedRegistration,
} from '../auth-registration-flag'

describe('auth-registration-flag', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.restoreAllMocks()
  })

  it('returns false without the flag', () => {
    const { result } = renderHook(() => useHasCompletedRegistration())

    expect(result.current).toBe(false)
  })

  it('returns true after markRegistrationCompleted', () => {
    act(() => markRegistrationCompleted())
    const { result } = renderHook(() => useHasCompletedRegistration())

    expect(result.current).toBe(true)
  })

  it('returns false after clearRegistrationCompleted', () => {
    markRegistrationCompleted()
    clearRegistrationCompleted()
    const { result } = renderHook(() => useHasCompletedRegistration())

    expect(result.current).toBe(false)
  })

  it('returns false when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const { result } = renderHook(() => useHasCompletedRegistration())

    expect(result.current).toBe(false)
  })
})
