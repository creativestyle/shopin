/**
 * @jest-environment node
 */

jest.mock('@/features/content/get-layout', () => ({
  getHeaderLayout: jest.fn(),
}))
jest.mock('../top-bar', () => ({
  TopBar: jest.fn(),
}))

import React from 'react'
import { SiteTopBar } from '../site-top-bar'
import { getHeaderLayout } from '@/features/content/get-layout'
import { TopBar } from '../top-bar'

function mocks() {
  return {
    getHeaderLayout: jest.mocked(getHeaderLayout),
    TopBar: jest.mocked(TopBar),
  }
}

describe('SiteTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls getHeaderLayout with isDraft: false by default', async () => {
    mocks().getHeaderLayout.mockResolvedValue(null)
    await SiteTopBar()
    expect(mocks().getHeaderLayout).toHaveBeenCalledWith(false)
  })

  it('calls getHeaderLayout with isDraft: true when draft', async () => {
    mocks().getHeaderLayout.mockResolvedValue(null)
    await SiteTopBar({ isDraft: true })
    expect(mocks().getHeaderLayout).toHaveBeenCalledWith(true)
  })

  it('renders TopBar with topBarMessages from headerLayout', async () => {
    const messages = ['Free shipping over €50', '30-day returns']
    mocks().getHeaderLayout.mockResolvedValue({
      topBarMessages: messages,
    } as any)
    const element = await SiteTopBar({ isDraft: false })
    expect(React.isValidElement(element)).toBe(true)
    expect(
      (element as React.ReactElement<{ messages: string[] }>).props.messages
    ).toEqual(messages)
  })

  it('renders TopBar with empty messages array when headerLayout is null', async () => {
    mocks().getHeaderLayout.mockResolvedValue(null)
    const element = await SiteTopBar()
    expect(React.isValidElement(element)).toBe(true)
    expect(
      (element as React.ReactElement<{ messages: string[] }>).props.messages
    ).toEqual([])
  })
})
