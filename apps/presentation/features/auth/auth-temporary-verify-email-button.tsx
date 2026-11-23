'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'

interface TemporaryVerifyEmailButtonProps {
  href: string
  label: string
}

// TODO: Remove once email service provider is configured.
export function TemporaryVerifyEmailButton({
  href,
  label,
}: TemporaryVerifyEmailButtonProps) {
  const t = useTranslations('common')

  return (
    <>
      <Toast
        type='warning'
        withCloseButton={false}
      >
        {t('temporaryEmailServiceNotice')}
      </Toast>
      <Button
        asChild
        variant='primary'
        scheme='red'
        className='w-full uppercase'
      >
        <Link href={href}>{label}</Link>
      </Button>
    </>
  )
}
