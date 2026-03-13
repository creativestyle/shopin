import * as React from 'react'

import { cn } from '@/lib/utils'

function Table({
  className,
  type = 'flex',
  ...props
}: React.ComponentProps<'table'> & {
  type?: 'scrollable' | 'flex' | 'flex-simple'
}) {
  return (
    <div
      data-slot='table-container'
      className={cn(
        'relative w-full rounded-lg border border-gray-200 text-gray-950',
        {
          'overflow-x-auto p-4': type === 'scrollable',
          'lg:p-4': type === 'flex',
        },
        className
      )}
    >
      <table
        data-slot='table'
        className={cn(
          'group w-full',
          // Right-align last column on desktop for non-simple tables
          type !== 'flex-simple' &&
            'md:[&_td]:last:text-right md:[&_th]:last:text-right',
          // Flex table mobile layout
          type === 'flex' && [
            'caption-bottom',
            // Mobile: card layout
            'max-md:flex max-md:flex-col',
            'max-md:[&_:is(tbody,thead,tfoot,caption,tr,td,th)]:block',
            // Hide header on mobile
            'max-md:[&_thead>tr]:absolute max-md:[&_thead>tr]:-top-[99999px] max-md:[&_thead>tr]:-left-[99999px]',
            // Mobile row styling
            'max-md:[&_tr]:py-2',
            // Mobile cell styling with data labels
            'max-md:[&_td]:relative max-md:[&_td]:py-1 max-md:[&_td]:pl-[50%]',
            'max-md:[&_td]:text-left max-md:[&_td]:whitespace-normal',
            // Data label pseudo-element
            'max-md:[&_td]:before:absolute max-md:[&_td]:before:top-1 max-md:[&_td]:before:left-4',
            'max-md:[&_td]:before:w-[40%] max-md:[&_td]:before:whitespace-nowrap',
            'max-md:[&_td]:before:text-left max-md:[&_td]:before:font-bold',
            'max-md:[&_td]:before:content-[attr(data-title)]',
            // Mobile border radius
            'max-md:[&_tr:first-child]:rounded-t-lg max-md:[&_tr:last-child]:rounded-b-lg',
            'max-md:[&_tr:last-child>td:last-child]:border-0',
          ],
          // Flex-simple table mobile layout
          type === 'flex-simple' && [
            '[&_caption]:border-0 [&_caption]:px-6 [&_caption]:py-4',
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
            // Mobile: simple card layout
            'max-lg:flex max-lg:flex-col max-lg:[&_caption]:order-last',
            'max-lg:[&_:is(tbody,thead,tfoot,caption,td)]:block',
            'max-lg:[&_tr]:flex max-lg:[&_tr]:flex-col max-lg:[&_tr]:gap-2',
            'max-lg:[&_tr]:px-6 max-lg:[&_tr]:py-4',
            '[&_:is(th,td)]:px-6 max-lg:[&_:is(th,td)]:p-0',
          ]
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn('[&_tr]:border-b [&_tr]:border-gray-200', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr]:odd:bg-white [&_tr]:even:bg-gray-100', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'font-bold [&_tr]:border-t [&_tr]:border-gray-200',
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'p-4 text-left align-middle font-bold [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'px-4 py-2 align-middle lg:p-4 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot='table-caption'
      className={cn(
        'order-last caption-bottom px-4 pt-4 text-sm text-gray-500',
        'max-md:pb-4 md:border-t md:border-gray-200',
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
