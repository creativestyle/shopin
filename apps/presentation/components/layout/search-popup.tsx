'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '../ui/logo'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { MIN_SEARCH_QUERY_LENGTH } from '@config/constants'
import { useProductSearch } from '@/features/searchResults/use-product-search'
import { ProductCard } from '@/components/ui/product-card'
import SearchIcon from '@/public/icons/search.svg'
import CloseIcon from '@/public/icons/close.svg'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'

interface SearchPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SuggestionItem({
  suggestion,
  query,
  onClick,
}: {
  suggestion: string
  query: string
  onClick: () => void
}) {
  const lowerSuggestion = suggestion.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerSuggestion.indexOf(lowerQuery)

  return (
    <li>
      <button
        onClick={onClick}
        className='flex cursor-pointer items-center gap-2 text-left text-sm text-gray-700 hover:text-gray-950'
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
}

const boldRenderer = (chunks: React.ReactNode) => (
  <span className='font-bold'>{chunks}</span>
)

export function SearchPopup({ open, onOpenChange }: SearchPopupProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const { results, isLoading } = useProductSearch(query)

  const suggestions = results?.suggestions ?? []
  const hasResults =
    results && (suggestions.length > 0 || results.products.length > 0)

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setQuery('')
    }
    onOpenChange(value)
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-(--z-modal) bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 top-0 z-(--z-modal) max-h-dvh overflow-y-auto bg-white shadow-lg',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top',
            'duration-200'
          )}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>
              {t('searchPlaceholder')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description>
              {t('searchPlaceholder')}
            </DialogPrimitive.Description>
          </VisuallyHidden>

          {/* Top bar - 136px */}
          <div className='flex h-auto w-full items-center justify-between gap-[15px] p-2 px-5 lg:h-[136px] lg:gap-6 lg:p-0 lg:px-[30px]'>
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
            <form
              className='relative mx-auto flex h-12 w-full max-w-[920px] flex-1 items-center gap-3 rounded-full bg-gray-100 px-4 lg:mx-[70px]'
              onSubmit={(e) => {
                e.preventDefault()
                if (query.trim().length >= MIN_SEARCH_QUERY_LENGTH) {
                  onOpenChange(false)
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                }
              }}
            >
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
            </form>

            {/* Close Button - Desktop only */}
            <DialogPrimitive.Close className='hidden flex-shrink-0 cursor-pointer items-center gap-2 text-base text-gray-950 underline transition-colors hover:text-gray-700 lg:flex'>
              <span>{t('close')}</span>
              <CloseIcon className='size-6' />
            </DialogPrimitive.Close>
          </div>

          {/* Search Results */}
          {query.length >= MIN_SEARCH_QUERY_LENGTH && (
            <div className='border-t border-gray-100 px-5 py-6 lg:px-[30px]'>
              {isLoading && (
                <div className='flex min-h-[400px] items-center justify-center'>
                  <span className='text-sm text-gray-500'>{t('loading')}</span>
                </div>
              )}

              {!isLoading && results && !hasResults && (
                <div className='mx-auto flex min-h-[400px] w-full max-w-[1640px] items-center justify-center'>
                  <p className='text-sm text-gray-500'>
                    {t.rich('noSearchProducts', {
                      query,
                      bold: boldRenderer,
                    })}
                  </p>
                </div>
              )}

              {!isLoading && hasResults && (
                <div className='relative'>
                  <div className='mx-auto flex w-full max-w-[1640px] flex-col gap-4 lg:flex-row lg:justify-center lg:gap-12'>
                    {/* Suggestions */}
                    <div className='flex shrink-0 flex-col items-start gap-3 lg:w-[250px]'>
                      <h3 className='text-xs font-bold tracking-wider text-gray-950 uppercase'>
                        {t('suggestions')}
                      </h3>
                      {suggestions.length > 0 ? (
                        <ul className='flex flex-col gap-2'>
                          {suggestions.map((suggestion) => (
                            <SuggestionItem
                              key={suggestion}
                              suggestion={suggestion}
                              query={query}
                              onClick={() => setQuery(suggestion)}
                            />
                          ))}
                        </ul>
                      ) : (
                        <p className='text-sm text-gray-500'>
                          {t.rich('noSuggestions', {
                            bold: boldRenderer,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Product cards grid */}
                    <div className='flex max-w-[860px] min-w-0 flex-1 flex-col gap-4'>
                      <h3 className='text-xs font-bold tracking-wider text-gray-950 uppercase'>
                        {t('products')}
                      </h3>
                      {results.products.length > 0 ? (
                        <div className='grid grid-cols-2 gap-[15px] lg:grid-cols-4 lg:gap-[30px]'>
                          {results.products.map((product) => (
                            <ProductCard
                              key={product.id}
                              data={product}
                              locale={locale}
                              imageClassName='lg:h-60 lg:min-h-0 lg:grow-0 lg:basis-auto'
                              onClick={() => onOpenChange(false)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className='text-sm text-gray-500'>
                          {t.rich('noSearchProducts', {
                            query,
                            bold: boldRenderer,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && hasResults && (
                <div className='mt-8 flex justify-center'>
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
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
