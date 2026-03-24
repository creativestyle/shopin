import type { Meta, StoryObj } from '@storybook/react'
import { HorizontalScroller } from '@/components/ui/horizontal-scroller'
import { cn } from '@/lib/utils'

const meta = {
  title: 'UI/HorizontalScroller',
  component: HorizontalScroller,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    scheme: {
      control: { type: 'select' },
      options: ['dark', 'white'],
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.args.scheme === 'dark'
      return (
        <div
          className={cn(
            'flex min-h-screen w-full items-center justify-center p-6',
            isDark ? 'bg-[#030712]' : 'bg-white'
          )}
        >
          <div className='w-full max-w-6xl'>
            <Story />
          </div>
        </div>
      )
    },
  ],
} satisfies Meta<typeof HorizontalScroller>

export default meta
type Story = StoryObj<typeof meta>

const TILES = [
  {
    title: 'Merino crew jumper',
    body: 'Midweight knit, regular fit. Machine wash cold with similar colours.',
  },
  {
    title: 'Slim stretch jeans',
    body: 'Dark indigo rinse with a touch of stretch for all-day comfort.',
  },
  {
    title: 'Leather belt',
    body: 'Vegetable-tanned leather with a brushed buckle. Made in Italy.',
  },
  {
    title: 'Wool overshirt',
    body: 'Layer over tees or knits. Two chest pockets, corozo buttons.',
  },
  {
    title: 'Organic cotton tee',
    body: 'Soft jersey, crew neck. GOTS-certified cotton.',
  },
  {
    title: 'Down-free puffer',
    body: 'Lightweight fill, packable hood. Water-resistant shell.',
  },
  {
    title: 'Cashmere scarf',
    body: 'Ribbed ends, 180 × 30 cm. Dry clean only.',
  },
  {
    title: 'Canvas tote',
    body: 'Reinforced handles, inner zip pocket. Holds a 13" laptop.',
  },
] as const

function RecommendationTiles() {
  return (
    <div className='flex min-w-max gap-4'>
      {TILES.map((item, i) => (
        <article
          key={item.title}
          className='h-40 w-64 shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
        >
          <h3 className='mb-2 line-clamp-2 font-semibold text-gray-950'>
            {item.title}
          </h3>
          <p className='line-clamp-3 text-sm text-gray-600'>{item.body}</p>
          <p className='mt-2 text-xs text-gray-400'>SKU · {10021 + i}</p>
        </article>
      ))}
    </div>
  )
}

export const Default: Story = {
  args: {
    children: <RecommendationTiles />,
    scheme: 'white',
  },
}

export const DarkBackground: Story = {
  name: 'Dark background',
  args: {
    children: <RecommendationTiles />,
    scheme: 'dark',
  },
}
