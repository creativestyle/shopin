'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface PromoCodeSectionProps {
  label: string
}

export function PromoCodeSection({ label }: PromoCodeSectionProps) {
  return (
    <Accordion
      type='single'
      collapsible
    >
      <AccordionItem
        value='promo-code'
        className='border-0'
      >
        <AccordionTrigger className='p-0 text-sm/[1.6] font-normal text-gray-700 normal-case hover:underline'>
          {label}
        </AccordionTrigger>
        <AccordionContent className='pt-2 pb-0'>
          {/* TODO: Implement promo code input */}
          <p className='text-sm text-gray-500'>Promo code input coming soon</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
