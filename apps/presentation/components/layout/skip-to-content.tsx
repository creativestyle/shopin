import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { MAIN_CONTENT_ID } from './page-shell'

/**
 * Global skip-to-content link — first focusable element in the document.
 * Parked off-screen and slid into view on focus.
 */
export async function SkipToContent() {
  const t = await getTranslations('common')

  return (
    <Button
      asChild
      variant='primary'
      scheme='red'
      className='fixed top-4 left-4 z-(--z-skip-link) -translate-y-24 transition-transform focus:translate-y-0'
    >
      <a href={`#${MAIN_CONTENT_ID}`}>{t('skipToContent')}</a>
    </Button>
  )
}
