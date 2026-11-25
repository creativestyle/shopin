import type { BadgeResponse } from '@core/contracts/core/badge'

/**
 * Builds a discount badge (e.g., "-20%") when both regular and discounted
 * price amounts are provided.
 *
 * Rules:
 * - percentage = round((1 - discounted / regular) * 100)
 * - Only emitted if both values are present and regular > 0
 */
function buildDiscountBadge(
  regularPriceCents?: number,
  discountedCents?: number
): BadgeResponse | undefined {
  if (
    regularPriceCents !== undefined &&
    discountedCents !== undefined &&
    regularPriceCents > 0
  ) {
    const percentage = Math.round(
      (1 - discountedCents / regularPriceCents) * 100
    )
    return { variant: 'red', text: `-${percentage}%` }
  }
  return undefined
}

/**
 * Builds a "NEW" badge for recently created products.
 *
 * Rules:
 * - If createdAt is within the last 30 days (inclusive), emit the badge
 */
function buildNewBadge(createdAtISO?: string): BadgeResponse | undefined {
  if (!createdAtISO) {
    return undefined
  }
  const createdAt = new Date(createdAtISO)
  const daysSinceCreated =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated <= 30) {
    return { variant: 'blue', text: 'NEW' }
  }
  return undefined
}

export function mapBadges(
  regularPriceCents?: number,
  discountedCents?: number,
  createdAtISO?: string
): BadgeResponse[] | undefined {
  const badges: BadgeResponse[] = []

  // Discount badge (percentage off)
  const discountBadge = buildDiscountBadge(regularPriceCents, discountedCents)
  if (discountBadge) {
    badges.push(discountBadge)
  }

  // New arrival badge (created within the last 30 days)
  const newBadge = buildNewBadge(createdAtISO)
  if (newBadge) {
    badges.push(newBadge)
  }

  return badges.length > 0 ? badges : undefined
}
