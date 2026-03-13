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

  React.useEffect(() => {
    if (open) {
      setCurrentLevel(1)
      setSelectedCategory(undefined)
      setSelectedSubcategory(undefined)
    }
  }, [open])

  return {
    currentLevel,
    setCurrentLevel,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
  }
}
