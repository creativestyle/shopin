interface WishlistHeaderProps {
  title: string
  serverItemCount: number
  itemLabel: string
  itemsLabel: string
}

/**
 * Wishlist header that shows item count from server
 * Supports both authenticated users and guests (with anonymous sessions)
 */
export function WishlistHeader({
  title,
  serverItemCount,
  itemLabel,
  itemsLabel,
}: WishlistHeaderProps) {
  const label = serverItemCount === 1 ? itemLabel : itemsLabel

  return (
    <h1 className='mb-6 text-center text-[36px] font-normal'>
      {title}{' '}
      <span className='text-base font-normal'>
        ({serverItemCount} {label})
      </span>
    </h1>
  )
}
