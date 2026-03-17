import Link from 'next/link'
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
  return (
    <>
      <Toast
        type='warning'
        withCloseButton={false}
      >
        Button and link are temporary until email service provider is set up
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
