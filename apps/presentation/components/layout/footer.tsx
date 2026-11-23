import { getTranslations } from 'next-intl/server'
import type { FooterResponse } from '@core/contracts/content/layout'
import { StandardContainer } from '../ui/standard-container'
import { getFooterLayout } from '@/features/content/get-layout'
import { NewsletterBlock } from './footer/newsletter-block'
import { LinkSectionBlock } from './footer/link-section-block'
import { CustomerServiceBlock } from './footer/customer-service-block'
import { PaymentMethodsBlock } from './footer/payment-methods-block'
import { LegalBar } from './footer/legal-bar'
import { CountryBlock } from './footer/country-block'

function hasFooterContent(layout: FooterResponse) {
  return Boolean(
    layout.sections.length ||
    layout.legalLinks.length ||
    layout.copyright ||
    layout.newsletter ||
    layout.customerService ||
    layout.paymentMethods
  )
}

export async function Footer({ isDraft = false }: { isDraft?: boolean } = {}) {
  const layout = await getFooterLayout(isDraft)
  if (!layout || !hasFooterContent(layout)) {
    const t = await getTranslations('legalBar')
    return (
      <footer className='relative w-full'>
        <LegalBar
          legalLinks={[]}
          copyright={t('copyright')}
        />
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
          <CountryBlock title={layout.country?.title} />
        </div>
      </StandardContainer>

      <LegalBar
        legalLinks={layout.legalLinks}
        copyright={layout.copyright}
      />
    </footer>
  )
}
