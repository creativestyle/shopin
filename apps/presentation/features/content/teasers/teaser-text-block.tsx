import { Card } from '@/components/ui/card'
import type { TextTeaser } from '@core/contracts/content/teaser-text'

export function TeaserTextBlock({ teaser }: { teaser: TextTeaser }) {
  const { body } = teaser
  if (!body) {
    return null
  }
  return (
    <Card
      scheme='gray'
      className='p-4'
    >
      <p className='whitespace-pre-wrap text-gray-700'>{body}</p>
    </Card>
  )
}
