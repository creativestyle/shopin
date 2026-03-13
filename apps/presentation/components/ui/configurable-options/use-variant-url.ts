import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function useVariantUrl() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variantId = searchParams?.get('variantId') ?? null

  const updateUrl = (targetVariantId?: string) => {
    if (targetVariantId) {
      const params = new URLSearchParams()
      params.set('variantId', targetVariantId)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    } else {
      router.replace(pathname, { scroll: false })
    }
  }

  return { updateUrl, variantId }
}
