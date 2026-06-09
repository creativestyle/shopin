import React from 'react'

interface IconData {
  name: string
  Component: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconContext = (require as any).context('@/public/icons', false, /\.svg$/)

function toPascalCase(fileName: string) {
  return fileName
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function loadIcons(): IconData[] {
  return iconContext
    .keys()
    .map((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const componentModule: any = iconContext(key)
      const fileName = key.replace('./', '').replace('.svg', '')
      const Component = componentModule.default || componentModule

      return {
        name: toPascalCase(fileName),
        Component,
      }
    })
    .sort((left: IconData, right: IconData) =>
      left.name.localeCompare(right.name)
    )
}
