import { StandardContainer } from '../ui/standard-container'
import { getFooterLayout } from '@/features/content/get-layout'
import { NewsletterBlock } from './footer/newsletter-block'
import { LinkSectionBlock } from './footer/link-section-block'
import { CustomerServiceBlock } from './footer/customer-service-block'
import { PaymentMethodsBlock } from './footer/payment-methods-block'
import { LanguageBlock } from './footer/language-block'
import { LegalBar } from './footer/legal-bar'

export async function Footer() {
  const layout = await getFooterLayout()
  if (!layout) {
    return (
      <footer className='relative w-full bg-gray-100'>
        <LegalBar legalLinks={[]} />
      </footer>
    )
  }

  return (
    <footer className='relative w-full bg-gray-100'>
      {layout.newsletter && <NewsletterBlock newsletter={layout.newsletter} />}

      <StandardContainer className='py-16'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] lg:items-start'>
          {layout.sections.map((section, i) => (
            <LinkSectionBlock
              key={i}
              section={section}
            />
          ))}
          {layout.customerService && (
            <CustomerServiceBlock customerService={layout.customerService} />
          )}
          {layout.paymentMethods && (
            <PaymentMethodsBlock paymentMethods={layout.paymentMethods} />
          )}
          {layout.language && <LanguageBlock language={layout.language} />}
        </div>
      </StandardContainer>

      <LegalBar
        legalLinks={layout.legalLinks}
        copyright={layout.copyright}
      />
    </footer>
  )
}
