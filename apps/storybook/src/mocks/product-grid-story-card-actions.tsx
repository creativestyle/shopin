import CartIcon from '@/public/icons/cart.svg'
import { Button } from '@/components/ui/button'

/** Placeholder for `renderCardActions` in ProductGrid stories (no network). */
export function ProductGridStoryCardActions({
  className,
  onAction,
}: {
  className?: string
  onAction?: () => void
}) {
  return (
    <Button
      type='button'
      variant='primary'
      className={className}
      aria-label='Add to basket (Storybook preview)'
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onAction?.()
      }}
    >
      <CartIcon className='size-5' />
      Add to basket
    </Button>
  )
}
