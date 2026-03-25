'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '../ui/logo'
import { cn } from '@/lib/utils'
import { useProductSearch } from '@/hooks/use-product-search'
import { getProductHref } from '@/lib/product-utils'
import { PriceBox } from '@/components/ui/price/price-box'
import SearchIcon from '@/public/icons/search.svg'
import CloseIcon from '@/public/icons/close.svg'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'

interface SearchPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchPopup({ open, onOpenChange }: SearchPopupProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const [query, setQuery] = React.useState('')
  const { results, isLoading } = useProductSearch(query)

  const hasResults =
    results &&
    (results.suggestions.length > 0 || results.products.length > 0)

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) setQuery('')
        onOpenChange(value)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-(--z-modal) bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 top-0 z-(--z-modal) bg-white shadow-lg',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top',
            'duration-200'
          )}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>{t('searchPlaceholder')}</DialogPrimitive.Title>
          </VisuallyHidden>

          {/* Top bar - 136px */}
          <div className='flex h-[136px] w-full items-center justify-between gap-[15px] px-5 lg:gap-6 lg:px-[30px]'>
            {/* Logo (desktop) / Back chevron (mobile) */}
            <div className='flex flex-shrink-0 items-center'>
              <div className='hidden lg:block'>
                <Logo
                  src='/logo.svg'
                  className='h-12 w-40'
                  width={156}
                  height={48}
                />
              </div>
              <DialogPrimitive.Close className='flex cursor-pointer items-center justify-center text-gray-950 lg:hidden'>
                <ChevronLeftIcon className='size-6' />
                <span className='sr-only'>{t('close')}</span>
              </DialogPrimitive.Close>
            </div>

            {/* Search Input */}
            <div className='relative mx-auto flex h-12 w-full max-w-[920px] flex-1 items-center gap-3 rounded-full bg-gray-100 px-4 lg:mx-[70px]'>
              <SearchIcon className='size-6 flex-shrink-0 text-gray-500' />
              <input
                type='text'
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                aria-label={t('searchPlaceholder')}
                className='w-full border-none bg-transparent text-sm leading-normal font-normal text-gray-900 outline-none placeholder:text-gray-500'
              />
            </div>

            {/* Close Button - Desktop only */}
            <DialogPrimitive.Close className='hidden flex-shrink-0 cursor-pointer items-center gap-2 text-base underline text-gray-950 transition-colors hover:text-gray-700 lg:flex'>
              <span>{t('close')}</span>
              <CloseIcon className='size-6' />
            </DialogPrimitive.Close>
          </div>

          {/* Search Results */}
          {query.length >= 3 && (
            <div className='border-t border-gray-100 px-5 py-6 lg:px-[30px]'>
              {isLoading && !hasResults && (
                <div className='flex justify-center py-8'>
                  <span className='text-sm text-gray-500'>
                    {t('loading')}
                  </span>
                </div>
              )}

              {hasResults && (
                <div className={cn('mx-auto flex max-w-[920px] gap-10 transition-opacity duration-150', isLoading && 'pointer-events-none opacity-50')}>
                  {/* Left column - Suggestions */}
                  {results.suggestions.length > 0 && (
                    <div className='flex min-w-0 flex-1 flex-col gap-3'>
                      <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                        {t('suggestions' as Parameters<typeof t>[0])}
                      </h3>
                      <ul className='flex flex-col gap-2'>
                        {results.suggestions.map((suggestion) => {
                          const lowerSuggestion = suggestion.toLowerCase()
                          const lowerQuery = query.toLowerCase()
                          const matchIndex = lowerSuggestion.indexOf(lowerQuery)

                          return (
                          <li key={suggestion}>
                            <button
                              onClick={() => setQuery(suggestion)}
                              className='flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-gray-950'
                            >
                              <SearchIcon className='size-4 flex-shrink-0 text-gray-400' />
                              <span>
                                {matchIndex >= 0 ? (
                                  <>
                                    {suggestion.slice(0, matchIndex)}
                                    <span className='font-bold'>
                                      {suggestion.slice(matchIndex, matchIndex + lowerQuery.length)}
                                    </span>
                                    {suggestion.slice(matchIndex + lowerQuery.length)}
                                  </>
                                ) : (
                                  suggestion
                                )}
                              </span>
                            </button>
                          </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Right column - Product results */}
                  {results.products.length > 0 && (
                    <div className='flex min-w-0 flex-1 flex-col gap-3'>
                      <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                        {t('products' as Parameters<typeof t>[0])}
                      </h3>
                      <div className='flex flex-col gap-3'>
                        {results.products.map((product) => (
                          <Link
                            key={product.id}
                            href={getProductHref(product.slug, product.variantId)}
                            onClick={() => onOpenChange(false)}
                            className='flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50'
                          >
                            <div className='relative size-16 flex-shrink-0 overflow-hidden rounded bg-gray-50'>
                              <Image
                                src={product.image.src}
                                alt={product.image.alt || product.name}
                                fill
                                className='object-contain'
                                sizes='64px'
                              />
                            </div>
                            <div className='flex min-w-0 flex-col gap-1'>
                              <span className='truncate text-sm font-bold text-gray-900'>
                                {product.name}
                              </span>
                              <PriceBox
                                price={product.price}
                                locale={locale}
                                size='small'
                                className='text-sm font-bold text-gray-950'
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/search?q=${encodeURIComponent(query)}`}
                        onClick={() => onOpenChange(false)}
                        className='mt-1 inline-flex items-center justify-center rounded-full border border-gray-950 px-6 py-2.5 text-sm font-bold text-gray-950 transition-colors hover:bg-gray-950 hover:text-white'
                      >
                        {t('showAllResults')}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {!isLoading && !hasResults && query.length >= 3 && (
                <div className='flex justify-center py-8'>
                  <span className='text-sm text-gray-500'>
                    {t('noDataFound')}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
