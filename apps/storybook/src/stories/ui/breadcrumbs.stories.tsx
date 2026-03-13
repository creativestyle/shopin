import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Button } from '@/components/ui/button'
import { CrumbResponse } from '@core/contracts/core/crumb'
import { useState } from 'react'

const meta: Meta<typeof Breadcrumbs> = {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  argTypes: {
    crumbs: {
      control: { type: 'object' },
      description: 'Array of breadcrumb items',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Interactive component for the story
const InteractiveBreadcrumbs = () => {
  const fullCrumbsArray: CrumbResponse[] = [
    { label: 'Sortiment', path: '/sortiment' },
    { label: 'Garten', path: '/sortiment/garten' },
    { label: 'Dünger', path: '/sortiment/garten/deunger' },
    { label: 'Gartendünger', path: '/sortiment/garten/duenger/gartenduenger' },
    {
      label: 'Meeresalgenkalk Biorga HBG 8 kg',
      path: '/sortiment/garten/duenger/gartenduenger/meeresalgenkalk-biorga-hbg-8-kg',
    },
  ]

  const [visibleCrumbsCount, setVisibleCrumbsCount] = useState<number>(5)

  const addCrumb = () => {
    if (visibleCrumbsCount < fullCrumbsArray.length) {
      setVisibleCrumbsCount(visibleCrumbsCount + 1)
    }
  }

  const removeCrumb = () => {
    if (visibleCrumbsCount > 1) {
      setVisibleCrumbsCount(visibleCrumbsCount - 1)
    }
  }

  const visibleCrumbs = fullCrumbsArray.slice(0, visibleCrumbsCount)

  return (
    <div className='w-audo max-w-[calc(100vw-2rem)]'>
      <Breadcrumbs crumbs={visibleCrumbs} />

      <div className='mt-8 flex justify-center gap-2'>
        <Button
          onClick={addCrumb}
          disabled={visibleCrumbsCount >= fullCrumbsArray.length}
          variant='primary'
        >
          Add Crumb
        </Button>
        <Button
          onClick={removeCrumb}
          disabled={visibleCrumbsCount <= 1}
          variant='secondary'
        >
          Remove Crumb
        </Button>
      </div>
    </div>
  )
}

// Interactive story with add/remove functionality
export const Interactive: Story = {
  render: () => <InteractiveBreadcrumbs />,
}
