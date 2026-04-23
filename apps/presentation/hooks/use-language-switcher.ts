'use client'

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { useLocale } from 'next-intl'
import { LOCALE_CONFIG } from '@config/constants'
import { useOutsideClick } from './use-outside-click'
import { useLocaleSwitcher } from '@/features/locale-routing/use-locale-switcher'

const languages = Object.values(LOCALE_CONFIG)

export function useLanguageSwitcher() {
  const locale = useLocale()
  const { switchTo, isPending } = useLocaleSwitcher()
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  useOutsideClick(
    listRef,
    () => {
      setIsOpen(false)
      setFocusedIndex(-1)
    },
    isOpen
  )

  const currentLanguage = languages.find((l) => l.urlPrefix === locale)
  const activeOptionId =
    isOpen && focusedIndex >= 0
      ? `${listboxId}-option-${focusedIndex}`
      : undefined

  const select = (prefix: string) => {
    switchTo(prefix)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const close = () => {
    setIsOpen(false)
    setFocusedIndex(-1)
    buttonRef.current?.focus()
  }

  const open = () => {
    setIsOpen(true)
    setFocusedIndex(0)
    requestAnimationFrame(() => listRef.current?.focus())
  }

  const toggle = (e: MouseEvent) => {
    e.stopPropagation()
    isOpen ? close() : open()
  }

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      open()
    }
  }

  const onListKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % languages.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(
          (prev) => (prev - 1 + languages.length) % languages.length
        )
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) {
          select(languages[focusedIndex].urlPrefix)
        }
        break
    }
  }

  return {
    languages,
    currentLanguage,
    isOpen,
    isPending,
    focusedIndex,
    buttonRef,
    listRef,
    listboxId,
    activeOptionId,
    toggle,
    select,
    onButtonKeyDown,
    onListKeyDown,
  }
}
