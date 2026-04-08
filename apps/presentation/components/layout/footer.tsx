import { StandardContainer } from '../ui/standard-container'
import { getFooterLayout } from '@/features/content/get-layout'
import { NewsletterBlock } from './footer/newsletter-block'
import { LinkSectionBlock } from './footer/link-section-block'
import { CustomerServiceBlock } from './footer/customer-service-block'
import { SocialBlock } from './footer/social-block'
import { GiftVoucherBlock } from './footer/gift-voucher-block'
import { PaymentMethodsBlock } from './footer/payment-methods-block'
import { ShippingBlock } from './footer/shipping-block'
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
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {layout.sections.map((section, i) => (
            <LinkSectionBlock
              key={i}
              section={section}
            />
          ))}
          {layout.customerService && (
            <CustomerServiceBlock customerService={layout.customerService} />
          )}
          {layout.social && <SocialBlock social={layout.social} />}
          {layout.giftVoucher && (
            <GiftVoucherBlock giftVoucher={layout.giftVoucher} />
          )}
        </div>

        <div className='mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {layout.paymentMethods && (
            <PaymentMethodsBlock paymentMethods={layout.paymentMethods} />
          )}
          {layout.shipping && <ShippingBlock shipping={layout.shipping} />}
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
