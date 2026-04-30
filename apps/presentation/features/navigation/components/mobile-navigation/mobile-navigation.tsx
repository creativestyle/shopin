'use client'

import { useLocale, useTranslations } from 'next-intl'
import { rfcToUrlPrefix } from '@config/constants'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type { LinkResponse, SubcategoryLink } from '@core/contracts/core/link'
import CloseIcon from '@/public/icons/close.svg'
import ChevronRightIcon from '@/public/icons/chevronright.svg'
import { Logo } from '@/components/ui/logo'
import { NavigationList } from './navigation-list'
import { NavigationAccordion } from './navigation-accordion'
import { useNavigationState } from '../../hooks/use-navigation-state'

interface MobileNavigationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: MainNavigationResponse | null
}

export function MobileNavigation({
  open,
  onOpenChange,
  navigation,
}: MobileNavigationProps) {
  const {
    currentLevel,
    setCurrentLevel,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
  } = useNavigationState(open)

  const t = useTranslations('common')
  const locale = useLocale()
  const homeHref = `/${rfcToUrlPrefix(locale)}`

  function openSecondLevel(category: LinkResponse) {
    setCurrentLevel(2)
    setSelectedCategory(category)
  }

  function openThirdLevel(subcategory: SubcategoryLink) {
    setCurrentLevel(3)
    setSelectedSubcategory(subcategory)
  }

  function goBackOneLevel() {
    if (currentLevel === 3) {
      setCurrentLevel(2)
      setSelectedSubcategory(undefined)
    } else if (currentLevel === 2) {
      setCurrentLevel(1)
      setSelectedCategory(undefined)
    }
  }

  function closeMobileNavigation() {
    onOpenChange(false)
  }

  if (!navigation) {
    return null
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        showCloseButton={false}
        side='left'
        className='max-w-80'
      >
        <VisuallyHidden>
          <SheetTitle>{t('navigation')}</SheetTitle>
          <SheetDescription>{t('mobileNavigationMenu')}</SheetDescription>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className='relative flex h-14 shrink-0 items-center justify-center px-4 shadow-down'>
          {/* Back button - show on level 2 and 3 */}
          {currentLevel > 1 && (
            <button
              onClick={goBackOneLevel}
              className='absolute left-4 flex size-6 shrink-0 items-center justify-center lord-of-the-focus-ring rounded'
              aria-label='Go back'
            >
              <ChevronRightIcon
                className='size-6 rotate-180'
                aria-hidden='true'
              />
            </button>
          )}

          {currentLevel === 1 ? (
            <div className='h-10 w-32'>
              <Logo
                src='/logo.svg'
                href={homeHref}
                alt='Logo'
                width={130}
                height={40}
              />
            </div>
          ) : currentLevel === 2 ? (
            <span className='max-w-50 truncate text-base font-normal'>
              {selectedCategory?.text}
            </span>
          ) : (
            <span className='max-w-50 truncate text-base font-normal'>
              {selectedSubcategory?.text}
            </span>
          )}

          {/* Close button */}
          <button
            onClick={closeMobileNavigation}
            className='absolute right-4 flex size-6 shrink-0 cursor-pointer items-center justify-center lord-of-the-focus-ring rounded'
            aria-label={t('close')}
          >
            <CloseIcon
              className='size-6'
              aria-hidden='true'
            />
          </button>
        </div>

        <SheetBody className='relative flex-row overflow-hidden p-0'>
          <NavigationList
            className={cn('duration-500 motion-safe:transition-transform', {
              '-translate-x-full': currentLevel > 1,
            })}
            items={navigation.items}
            onItemSelect={openSecondLevel}
            onLinkClick={closeMobileNavigation}
            showFooter={true}
            {...(currentLevel > 1 && { inert: true })}
          />
          <NavigationList
            className={cn(
              'absolute top-0 left-0 duration-500 motion-safe:transition-transform',
              {
                'translate-x-full': currentLevel === 1,
                '-translate-x-full': currentLevel === 3,
              }
            )}
            items={selectedCategory?.children ?? []}
            onItemSelect={openThirdLevel}
            onLinkClick={closeMobileNavigation}
            viewAllHref={selectedCategory?.href}
            viewAllLabel={t('viewAll')}
            {...(currentLevel !== 2 && { inert: true })}
          />
          <NavigationAccordion
            className={cn(
              'absolute top-0 left-0 duration-500 motion-safe:transition-transform',
              {
                'translate-x-full': currentLevel !== 3,
              }
            )}
            subcategory={selectedSubcategory}
            onBackClick={goBackOneLevel}
            onLinkClick={closeMobileNavigation}
            {...(currentLevel !== 3 && { inert: true })}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
