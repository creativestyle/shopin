import { render, screen } from '@testing-library/react'
import { SEOTextSection } from '@/components/ui/seo-text-section'

describe('SEOTextSection', () => {
  it('renders provided title and content', () => {
    render(
      <SEOTextSection
        title='Specs'
        content='Spec content'
      />
    )
    expect(screen.getByText('Specs')).toBeInTheDocument()
    expect(screen.getByText('Spec content')).toBeInTheDocument()
  })
})
