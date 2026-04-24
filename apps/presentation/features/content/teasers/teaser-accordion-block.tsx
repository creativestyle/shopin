'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useHasMounted } from '@/hooks/use-has-mounted'
import type { AccordionTeaser } from '@core/contracts/content/teaser-accordion'
import { TeaserRichTextBlock } from './teaser-rich-text-block'

/**
 * Renders a static placeholder with the same layout as the accordion (closed state).
 * Used during SSR to avoid hydration mismatch (Radix generates different IDs on server vs client).
 * Always renders all items closed — items with expanded=true will appear open only after hydration.
 */
function AccordionPlaceholder({ items }: { items: AccordionTeaser['items'] }) {
  return (
    <div
      className='w-full'
      data-slot='accordion'
    >
      {items.map((item, i) => (
        <div
          key={i}
          className='border-b border-gray-200 last:border-b-0'
          data-slot='accordion-item'
        >
          <div className='flex gap-4 py-6 text-lg font-medium text-gray-950'>
            {item.title}
          </div>
        </div>
      ))}
    </div>
  )
}

type AccordionRootProps =
  | { type: 'single'; collapsible: true; defaultValue: string | undefined }
  | { type: 'multiple'; defaultValue: string[] }

export function TeaserAccordionBlock({
  teaser,
  imagePreload,
}: {
  teaser: AccordionTeaser
  imagePreload?: boolean
}) {
  const { title, items } = teaser
  const mounted = useHasMounted()

  function getAccordionProps(): AccordionRootProps {
    const defaultValue = teaser.items.flatMap((item, i) =>
      item.expanded ? [`item-${i}`] : []
    )

    if (teaser.mode === 'multiple') {
      return { type: 'multiple', defaultValue }
    }
    return { type: 'single', collapsible: true, defaultValue: defaultValue[0] }
  }

  const accordionProps = getAccordionProps()

  if (!items?.length) {
    return null
  }

  return (
    <section aria-label={title}>
      {title && (
        <h2 className='mb-4 text-xl font-semibold tracking-tight md:text-2xl'>
          {title}
        </h2>
      )}
      {mounted ? (
        <Accordion
          {...accordionProps}
          className='w-full'
        >
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
            >
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>
                {item.body && (
                  <TeaserRichTextBlock
                    richText={item.body}
                    imagePreload={imagePreload}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <AccordionPlaceholder items={items} />
      )}
    </section>
  )
}
