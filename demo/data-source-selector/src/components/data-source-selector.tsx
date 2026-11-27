'use client'

import { useId } from 'react'
import type { SetupCategory } from '../rows'

export interface DataSourceSelectorLabels {
  title: string
  intro: string
  select: string
  selected: string
  /** Before the reason a category has no provider now. */
  unavailable: string
  /** A category's heading. */
  category: (category: string) => string
}

interface DataSourceSelectorProps {
  labels: DataSourceSelectorLabels
  rows: readonly SetupCategory[]
  /** Applies a provider choice (writes the category's switch cookie). */
  onSelect: (cookie: string, provider: string) => void
}

export function DataSourceSelector({
  labels,
  rows,
  onSelect,
}: DataSourceSelectorProps) {
  const id = useId()
  const headingId = `${id}-heading`

  const choose = (cookie: string, provider: string) => {
    onSelect(cookie, provider)
    // Reload the page to apply the new provider
    window.location.reload()
  }

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h2
        id={headingId}
        className='text-xl font-semibold mb-4'
      >
        {labels.title}
      </h2>
      <p className='text-gray-600 mb-4'>{labels.intro}</p>

      {rows.map((row) => {
        const rowId = `${id}-${row.category}`
        return (
          <section
            key={row.category}
            aria-labelledby={`${rowId}-heading`}
            className='mb-6'
          >
            <h3
              id={`${rowId}-heading`}
              className='text-lg font-semibold mb-2'
            >
              {labels.category(row.category)}
            </h3>
            {row.unavailable && (
              <p className='text-sm text-red-700 mb-2'>
                {labels.unavailable} {row.unavailable}
              </p>
            )}
            <div
              role='group'
              aria-labelledby={`${rowId}-heading`}
              className='space-y-3'
            >
              {row.options.map((option) => {
                const nameId = `${rowId}-${option.id}-name`
                const buttonId = `${rowId}-${option.id}-button`
                const descriptionId = `${rowId}-${option.id}-description`
                const reasonId = `${rowId}-${option.id}-reason`
                const disabled = Boolean(option.disabledReason)
                return (
                  <div
                    key={option.id}
                    className='flex items-center justify-between gap-4 p-3 border border-gray-300 rounded-lg'
                  >
                    <div>
                      <h4
                        id={nameId}
                        className='font-medium'
                      >
                        {option.name}
                      </h4>
                      {option.description && (
                        <p
                          id={descriptionId}
                          className='text-sm text-gray-500'
                        >
                          {option.description}
                        </p>
                      )}
                      {option.disabledReason && (
                        <p
                          id={reasonId}
                          className='text-sm text-gray-700'
                        >
                          {option.disabledReason}
                        </p>
                      )}
                    </div>
                    <button
                      id={buttonId}
                      type='button'
                      aria-pressed={option.selected}
                      disabled={disabled}
                      aria-labelledby={`${nameId} ${buttonId}`}
                      aria-describedby={
                        [
                          option.description ? descriptionId : '',
                          disabled ? reasonId : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                      className={`inline-flex items-center justify-center transition-all duration-200 box-border px-6 py-3 text-sm font-bold leading-tight rounded-full ${
                        option.selected
                          ? 'bg-gray-200 text-gray-900 border-2 border-gray-700'
                          : disabled
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'cursor-pointer bg-primary text-white hover:bg-secondary active:bg-primary shadow-sm'
                      }`}
                      onClick={() =>
                        !option.selected && choose(row.cookie, option.id)
                      }
                    >
                      {option.selected ? labels.selected : labels.select}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
