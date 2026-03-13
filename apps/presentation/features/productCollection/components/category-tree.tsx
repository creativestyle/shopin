'use client'

import Link from 'next/link'
import type { CategoryTreeNode } from '@core/contracts/product-collection/product-collection'
import { cn } from '@/lib/utils'

interface CategoryTreeProps {
  categories: CategoryTreeNode[]
  currentCategoryId?: string
  className?: string
}

/**
 * Checks if a category or any of its descendants matches the target ID.
 * Used to highlight the entire ancestor path (breadcrumb-style).
 */
function isInActivePath(
  category: CategoryTreeNode,
  targetId?: string
): boolean {
  if (!targetId) {
    return false
  }
  if (category.id === targetId) {
    return true
  }
  return (
    category.children?.some((child) => isInActivePath(child, targetId)) ?? false
  )
}

function CategoryTreeItem({
  category,
  currentCategoryId,
  level = 0,
}: {
  category: CategoryTreeNode
  currentCategoryId?: string
  level?: number
}) {
  const isActive = isInActivePath(category, currentCategoryId)
  const hasChildren = category.children && category.children.length > 0

  return (
    <li className='flex flex-col gap-4'>
      <Link
        href={`/c/${category.slug}`}
        className={cn(
          'block font-bold transition-colors',
          level === 0 ? 'text-base' : 'text-sm',
          level > 0 && 'pl-3',
          isActive ? 'text-[#030712]' : 'text-[#6B7280]'
        )}
      >
        {category.name}
      </Link>
      {hasChildren && (
        <ul className='ml-3 flex flex-col gap-4'>
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              currentCategoryId={currentCategoryId}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function CategoryTree({
  categories,
  currentCategoryId,
  className,
}: CategoryTreeProps) {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <nav className={cn('w-56 shrink-0', className)}>
      <ul className='flex flex-col gap-4'>
        {categories.map((category) => (
          <CategoryTreeItem
            key={category.id}
            category={category}
            currentCategoryId={currentCategoryId}
          />
        ))}
      </ul>
    </nav>
  )
}
