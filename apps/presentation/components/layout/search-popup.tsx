'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Link from 'next/link'
import { Logo } from '../ui/logo'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { useProductSearch } from '@/features/searchResults/use-product-search'
import { ProductCard } from '@/components/ui/product-card'
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
    results && (results.suggestions.length > 0 || results.products.length > 0)

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) {setQuery('')}
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
            <DialogPrimitive.Title>
              {t('searchPlaceholder')}
            </DialogPrimitive.Title>
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
            <DialogPrimitive.Close className='hidden flex-shrink-0 cursor-pointer items-center gap-2 text-base text-gray-950 underline transition-colors hover:text-gray-700 lg:flex'>
              <span>{t('close')}</span>
              <CloseIcon className='size-6' />
            </DialogPrimitive.Close>
          </div>

          {/* Search Results */}
          {query.length >= 3 && (
            <div className='border-t border-gray-100 px-5 py-6 lg:px-[30px]'>
              {isLoading && !hasResults && (
                <div className='flex justify-center py-8'>
                  <span className='text-sm text-gray-500'>{t('loading')}</span>
                </div>
              )}

              {hasResults && (
                <div
                  className={cn(
                    'mx-auto flex w-full flex-col gap-4 transition-opacity duration-150 lg:flex-row lg:justify-between lg:gap-4',
                    isLoading && 'pointer-events-none opacity-50'
                  )}
                >
                  {/* Suggestions */}
                  {results.suggestions.length > 0 && (
                    <div className='flex max-w-[160px] shrink-0 flex-col items-start gap-3'>
                      <h3 className='text-xs font-bold tracking-wider text-gray-400 uppercase'>
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
                                className='flex cursor-pointer items-center gap-2 text-left text-sm text-gray-700 hover:text-gray-950'
                              >
                                <SearchIcon className='size-4 flex-shrink-0 text-gray-400' />
                                <span>
                                  {matchIndex >= 0 ? (
                                    <>
                                      {suggestion.slice(0, matchIndex)}
                                      <span className='font-bold'>
                                        {suggestion.slice(
                                          matchIndex,
                                          matchIndex + lowerQuery.length
                                        )}
                                      </span>
                                      {suggestion.slice(
                                        matchIndex + lowerQuery.length
                                      )}
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

                  {/* Product cards grid */}
                  {results.products.length > 0 && (
                    <div className='flex max-w-[1226px] min-w-0 flex-1 flex-col gap-4'>
                      <h3 className='text-xs font-bold tracking-wider text-gray-400 uppercase'>
                        {t('products' as Parameters<typeof t>[0])}
                      </h3>
                      <div className='grid grid-cols-2 gap-[15px] lg:grid-cols-4 lg:gap-[30px]'>
                        {results.products.map((product) => (
                          <ProductCard
                            key={product.id}
                            data={product}
                            locale={locale}
                            compact
                            onClick={() => onOpenChange(false)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasResults && (
                <div className='flex justify-center'>
                  <Button
                    variant='secondary'
                    scheme='red'
                    asChild
                    className='border-rose-700 text-gray-950 hover:text-gray-950'
                  >
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={() => onOpenChange(false)}
                    >
                      {t('showAllResults')}
                    </Link>
                  </Button>
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
