import * as React from 'react'
import type { LinkResponse, SubcategoryLink } from '@core/contracts/core/link'

export function useNavigationState(open: boolean) {
  const [currentLevel, setCurrentLevel] = React.useState<1 | 2 | 3>(1)
  const [selectedCategory, setSelectedCategory] = React.useState<
    LinkResponse | undefined
  >()
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<
    SubcategoryLink | undefined
  >()

  // Reset to the first level whenever the navigation opens (adjusting state during render)
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCurrentLevel(1)
      setSelectedCategory(undefined)
      setSelectedSubcategory(undefined)
    }
  }

  return {
    currentLevel,
    setCurrentLevel,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
  }
}
