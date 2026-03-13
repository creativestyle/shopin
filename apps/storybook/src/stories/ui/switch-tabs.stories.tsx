import type { Meta, StoryObj } from '@storybook/react'
import {
  SwitchTabs,
  SwitchTabsList,
  SwitchTabsTrigger,
  SwitchTabsContent,
} from '@/components/ui/switch-tabs'

const meta: Meta<typeof SwitchTabs> = {
  title: 'UI/SwitchTabs',
  component: SwitchTabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const CustomerType: Story = {
  render: () => (
    <div className='max-w-[600px]'>
      <SwitchTabs
        defaultValue='private'
        className='w-full'
      >
        <SwitchTabsList>
          <SwitchTabsTrigger value='private'>Privatkunde</SwitchTabsTrigger>
          <SwitchTabsTrigger value='business'>Firmenkunde</SwitchTabsTrigger>
        </SwitchTabsList>
        <SwitchTabsContent value='private'>
          <div className='rounded-lg bg-gray-100 p-6'>
            <h3 className='mb-3 text-xl font-semibold'>
              Private Customer Registration
            </h3>
            <p className='mb-4 text-gray-600'>
              Create your personal account to enjoy exclusive benefits, track
              your orders, and manage your wishlist. Perfect for individual
              shoppers who want a personalized shopping experience.
            </p>
            <div className='space-y-4'>
              <div className='rounded-lg bg-white p-4 shadow-sm'>
                <h4 className='mb-2 font-medium text-gray-900'>
                  Personal Information
                </h4>
                <p className='text-sm text-gray-600'>
                  Enter your name, email, and contact details for your personal
                  account.
                </p>
              </div>
              <div className='rounded-lg bg-white p-4 shadow-sm'>
                <h4 className='mb-2 font-medium text-gray-900'>
                  Account Benefits
                </h4>
                <ul className='space-y-1 text-sm text-gray-600'>
                  <li>• Order tracking and history</li>
                  <li>• Wishlist and favorites</li>
                  <li>• Personalized recommendations</li>
                  <li>• Exclusive member discounts</li>
                </ul>
              </div>
            </div>
          </div>
        </SwitchTabsContent>
        <SwitchTabsContent value='business'>
          <div className='rounded-lg bg-gray-100 p-6'>
            <h3 className='mb-3 text-xl font-semibold'>
              Business Customer Registration
            </h3>
            <p className='mb-4 text-gray-600'>
              Set up your business account to access wholesale pricing, bulk
              ordering, and dedicated business support. Ideal for companies and
              organizations.
            </p>
            <div className='space-y-4'>
              <div className='rounded-lg bg-white p-4 shadow-sm'>
                <h4 className='mb-2 font-medium text-gray-900'>
                  Company Information
                </h4>
                <p className='text-sm text-gray-600'>
                  Provide your business details, tax information, and company
                  registration data.
                </p>
              </div>
              <div className='rounded-lg bg-white p-4 shadow-sm'>
                <h4 className='mb-2 font-medium text-gray-900'>
                  Business Benefits
                </h4>
                <ul className='space-y-1 text-sm text-gray-600'>
                  <li>• Wholesale pricing and bulk discounts</li>
                  <li>• Dedicated account manager</li>
                  <li>• Flexible payment terms</li>
                  <li>• Priority customer support</li>
                </ul>
              </div>
            </div>
          </div>
        </SwitchTabsContent>
      </SwitchTabs>
    </div>
  ),
}
