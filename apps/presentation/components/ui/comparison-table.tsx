import * as React from 'react'
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

import {
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import CheckIcon from '@/public/icons/checkmark.svg'
import CrossIcon from '@/public/icons/close.svg'

/**
 * Helper function to replace placeholders in string content with React elements
 * Use case: replacing {y} and {n} in table cells with icons
 * @param children - The React children to process
 * @param replacements - Object mapping placeholder strings to React elements
 * @returns Processed children with placeholders replaced
 */
function replacePlaceholdersInChildren(
  children: React.ReactNode,
  replacements: Record<string, React.ReactElement>
): React.ReactNode {
  if (typeof children === 'string') {
    let result: React.ReactNode = children

    // Process all replacements on the string
    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      if (typeof result === 'string' && result.includes(placeholder)) {
        const parts = result.split(placeholder)
        result = parts.reduce((acc, part, index) => {
          if (index === 0) {
            return part ? [part] : []
          }
          return [
            ...acc,
            React.cloneElement(replacement, { key: `${placeholder}-${index}` }),
            part,
          ].filter(Boolean)
        }, [] as React.ReactNode[])
      }
    })

    // If we have an array result, process each string element recursively
    if (Array.isArray(result)) {
      return result.map((item) => {
        if (typeof item === 'string') {
          return replacePlaceholdersInChildren(item, replacements)
        }
        return item
      })
    }

    return result
  }

  return children
}

function ComparisonTable({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot='table-container'
      className={cn(
        'relative w-full rounded-lg border border-gray-200 text-gray-950 lg:p-4',
        className
      )}
    >
      <table
        data-slot='table'
        className={cn(
          'group w-full [&_caption]:border-0',
          // Border radius for different table sections
          'max-lg:[&_thead>tr:first-child]:rounded-t-lg',
          'lg:[&_thead>tr:first-child>td:first-child]:rounded-tl-lg',
          'lg:[&_thead>tr:first-child>td:last-child]:rounded-tr-lg',
          'max-lg:[&:not(:has(thead))_tbody>tr:first-child]:rounded-t-lg',
          'lg:[&:not(:has(thead))_tbody>tr:first-child>td:first-child]:rounded-tl-lg',
          'lg:[&:not(:has(thead))_tbody>tr:first-child>td:last-child]:rounded-tr-lg',
          'max-lg:[&_tfoot>tr:last-child]:rounded-b-lg',
          'lg:[&_tfoot>tr:last-child>td:first-child]:rounded-bl-lg',
          'lg:[&_tfoot>tr:last-child>td:last-child]:rounded-br-lg',
          'max-lg:[&:not(:has(tfoot))_tbody>tr:last-child]:rounded-b-lg',
          'lg:[&:not(:has(tfoot))_tbody>tr:last-child>td:first-child]:rounded-bl-lg',
          'lg:[&:not(:has(tfoot))_tbody>tr:last-child>td:last-child]:rounded-br-lg',
          // Mobile: flexible card layout
          'max-lg:flex max-lg:flex-col max-lg:[&_caption]:order-last',
          'max-lg:[&_:is(tbody,thead,tfoot,caption,td)]:block',
          'max-lg:[&_tr]:flex max-lg:[&_tr]:flex-wrap max-lg:[&_tr]:items-center',
          'max-lg:[&_tr]:gap-2 max-lg:[&_tr]:px-6 max-lg:[&_tr]:py-4',
          '[&_:is(th,td)]:px-6 max-lg:[&_:is(th,td)]:p-0',
          // Sticky header styling
          'max-lg:[&_thead>tr:last-child]:border-b-2 max-lg:[&_thead>tr:last-child]:border-gray-950',
          'max-lg:[&_thead]:sticky max-lg:[&_thead]:top-0 max-lg:[&_thead]:bg-white',
          'max-lg:[&_thead]:rounded-t-lg',
          className
        )}
        {...props}
      />
    </div>
  )
}

function ComparisonTableHead({
  className,
  ...props
}: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'border-l border-gray-200 p-4 text-center first:border-0 first:text-left',
        'align-middle font-bold [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        // Mobile styling
        'max-lg:first:sr-only max-lg:[&:nth-child(2)]:border-0',
        'max-lg:flex-1 max-lg:border-gray-400',
        className
      )}
      {...props}
    />
  )
}

async function ComparisonTableCell({
  className,
  children,
  ...props
}: React.ComponentProps<'td'>) {
  const t = await getTranslations('common')

  const replacements = {
    '{y}': (
      <div>
        <CheckIcon
          className='inline size-5 text-green-600'
          aria-hidden='true'
        />
        <span className='sr-only'>{t('yes')}</span>
      </div>
    ),
    '{n}': (
      <div>
        <CrossIcon
          className='inline size-5 text-red-600'
          aria-hidden='true'
        />
        <span className='sr-only'>{t('no')}</span>
      </div>
    ),
  }

  return (
    <td
      data-slot='table-cell'
      className={cn(
        'border-l border-gray-200 px-4 py-2 text-center align-middle first:border-0',
        'lg:p-4 lg:first:text-left',
        // Mobile styling
        'max-lg:border-gray-400 max-lg:text-center max-lg:first:w-full max-lg:first:font-bold',
        'max-lg:not-first:flex-1 max-lg:[&:nth-child(2)]:border-0',
        className
      )}
      {...props}
    >
      {replacePlaceholdersInChildren(children, replacements)}
    </td>
  )
}

export {
  ComparisonTable,
  TableHeader as ComparisonTableHeader,
  TableBody as ComparisonTableBody,
  TableFooter as ComparisonTableFooter,
  ComparisonTableHead,
  TableRow as ComparisonTableRow,
  ComparisonTableCell,
  TableCaption as ComparisonTableCaption,
}
