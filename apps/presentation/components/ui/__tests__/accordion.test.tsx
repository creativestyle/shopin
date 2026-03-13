import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

describe('Accordion', () => {
  it('toggles a section open/closed', async () => {
    const user = userEvent.setup()
    render(
      <Accordion
        type='single'
        collapsible
        defaultValue='1'
      >
        <AccordionItem value='1'>
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent>Details content</AccordionContent>
        </AccordionItem>
        <AccordionItem value='2'>
          <AccordionTrigger>Care</AccordionTrigger>
          <AccordionContent>Care content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    const detailsButton = screen.getByRole('button', { name: 'Details' })
    expect(detailsButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(detailsButton)
    expect(detailsButton).toHaveAttribute('aria-expanded', 'false')

    const careButton = screen.getByRole('button', { name: 'Care' })
    await user.click(careButton)
    expect(careButton).toHaveAttribute('aria-expanded', 'true')
  })
})
