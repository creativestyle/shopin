import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import HomeIcon from '@/public/icons/home.svg'
import HeartIcon from '@/public/icons/heart.svg'
import CouponIcon from '@/public/icons/coupon.svg'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  render: () => (
    <Tabs defaultValue='products'>
      <TabsList>
        <TabsTrigger value='products'>Products</TabsTrigger>
        <TabsTrigger value='orders'>Orders</TabsTrigger>
        <TabsTrigger value='reviews'>Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value='products'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Product Catalog</h3>
          <p className='mb-4 text-gray-600'>
            Discover our extensive range of high-quality products. From
            electronics to home goods, we have everything you need for your
            daily life.
          </p>
          <div className='grid grid-cols-2 gap-4'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='font-medium text-gray-900'>Electronics</h4>
              <p className='text-sm text-gray-600'>Latest gadgets and tech</p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='font-medium text-gray-900'>Home & Garden</h4>
              <p className='text-sm text-gray-600'>Everything for your home</p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='orders'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Order History</h3>
          <p className='mb-4 text-gray-600'>
            Track your recent purchases and manage your orders. View order
            details, track shipments, and request returns.
          </p>
          <div className='space-y-3'>
            <div className='flex items-center justify-between rounded-lg bg-white p-4 shadow-sm'>
              <div>
                <h4 className='font-medium text-gray-900'>Order #12345</h4>
                <p className='text-sm text-gray-600'>Placed on Dec 15, 2024</p>
              </div>
              <span className='rounded-full bg-green-100 px-3 py-1 text-sm text-green-800'>
                Delivered
              </span>
            </div>
            <div className='flex items-center justify-between rounded-lg bg-white p-4 shadow-sm'>
              <div>
                <h4 className='font-medium text-gray-900'>Order #12346</h4>
                <p className='text-sm text-gray-600'>Placed on Dec 18, 2024</p>
              </div>
              <span className='rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800'>
                Shipped
              </span>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='reviews'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Product Reviews</h3>
          <p className='mb-4 text-gray-600'>
            Read customer reviews and share your own experiences. Help other
            customers make informed decisions.
          </p>
          <div className='space-y-4'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <div className='mb-2 flex items-center'>
                <div className='flex text-yellow-400'>{'★'.repeat(5)}</div>
                <span className='ml-2 text-sm text-gray-600'>Sarah M.</span>
              </div>
              <p className='text-gray-800'>
                &ldquo;Excellent quality and fast shipping. Highly
                recommended!&rdquo;
              </p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <div className='mb-2 flex items-center'>
                <div className='flex text-yellow-400'>{'★'.repeat(4)}</div>
                <span className='ml-2 text-sm text-gray-600'>John D.</span>
              </div>
              <p className='text-gray-800'>
                &ldquo;Great product, exactly as described. Will order
                again.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue='home'>
      <TabsList>
        <TabsTrigger value='home'>
          <HomeIcon className='size-6' />
          Home
        </TabsTrigger>
        <TabsTrigger value='wishlist'>
          <HeartIcon className='size-6' />
          Wishlist
        </TabsTrigger>
        <TabsTrigger value='offers'>
          <CouponIcon className='size-6' />
          Offers
        </TabsTrigger>
      </TabsList>
      <TabsContent value='home'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Welcome Home</h3>
          <p className='mb-4 text-gray-600'>
            Your personalized shopping dashboard with featured products, recent
            orders, and exclusive deals tailored just for you.
          </p>
          <div className='grid grid-cols-3 gap-4'>
            <div className='rounded-lg bg-white p-4 text-center shadow-sm'>
              <div className='mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-blue-100'>
                <HomeIcon className='size-6 text-blue-600' />
              </div>
              <h4 className='font-medium text-gray-900'>Featured Items</h4>
              <p className='text-sm text-gray-600'>Handpicked for you</p>
            </div>
            <div className='rounded-lg bg-white p-4 text-center shadow-sm'>
              <div className='mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-green-100'>
                <HeartIcon className='size-6 text-green-600' />
              </div>
              <h4 className='font-medium text-gray-900'>Wishlist</h4>
              <p className='text-sm text-gray-600'>Save for later</p>
            </div>
            <div className='rounded-lg bg-white p-4 text-center shadow-sm'>
              <div className='mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-yellow-100'>
                <CouponIcon className='size-6 text-yellow-600' />
              </div>
              <h4 className='font-medium text-gray-900'>Special Offers</h4>
              <p className='text-sm text-gray-600'>Limited time deals</p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='wishlist'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Your Wishlist</h3>
          <p className='mb-4 text-gray-600'>
            Save items you love and get notified when prices drop. Your personal
            collection of favorite products.
          </p>
          <div className='space-y-3'>
            <div className='flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm'>
              <div className='size-16 rounded-lg bg-gray-200'></div>
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>
                  Wireless Headphones
                </h4>
                <p className='text-sm text-gray-600'>Premium sound quality</p>
                <p className='text-lg font-semibold text-green-600'>$199.99</p>
              </div>
              <button className='rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600'>
                Remove
              </button>
            </div>
            <div className='flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm'>
              <div className='size-16 rounded-lg bg-gray-200'></div>
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>Smart Watch</h4>
                <p className='text-sm text-gray-600'>Fitness tracking & more</p>
                <p className='text-lg font-semibold text-green-600'>$299.99</p>
              </div>
              <button className='rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600'>
                Remove
              </button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='offers'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Special Offers</h3>
          <p className='mb-4 text-gray-600'>
            Don&apos;t miss out on these exclusive deals and limited-time
            offers. Save big on your favorite products.
          </p>
          <div className='space-y-4'>
            <div className='rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-semibold text-red-900'>
                    Flash Sale - 50% Off
                  </h4>
                  <p className='text-sm text-red-700'>Electronics & Gadgets</p>
                </div>
                <span className='rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white'>
                  Ends in 2h
                </span>
              </div>
            </div>
            <div className='rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-semibold text-blue-900'>Free Shipping</h4>
                  <p className='text-sm text-blue-700'>On orders over $50</p>
                </div>
                <span className='rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white'>
                  Valid
                </span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const RichTabs: Story = {
  render: () => (
    <Tabs defaultValue='dashboard'>
      <TabsList>
        <TabsTrigger value='dashboard'>Dashboard</TabsTrigger>
        <TabsTrigger value='products'>Products</TabsTrigger>
        <TabsTrigger value='orders'>Orders</TabsTrigger>
        <TabsTrigger value='customers'>Customers</TabsTrigger>
        <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        <TabsTrigger value='inventory'>Inventory</TabsTrigger>
        <TabsTrigger value='marketing'>Marketing</TabsTrigger>
        <TabsTrigger value='settings'>Settings</TabsTrigger>
      </TabsList>
      <TabsContent value='dashboard'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>E-commerce Dashboard</h3>
          <p className='mb-4 text-gray-600'>
            Comprehensive overview of your online store performance, sales
            metrics, and key business indicators.
          </p>
          <div className='grid grid-cols-4 gap-4'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='text-2xl font-bold text-green-600'>$12,450</h4>
              <p className='text-sm text-gray-600'>Total Revenue</p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='text-2xl font-bold text-blue-600'>1,234</h4>
              <p className='text-sm text-gray-600'>Orders</p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='text-2xl font-bold text-purple-600'>856</h4>
              <p className='text-sm text-gray-600'>Customers</p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='text-2xl font-bold text-orange-600'>4.8</h4>
              <p className='text-sm text-gray-600'>Rating</p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='products'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Product Management</h3>
          <p className='mb-4 text-gray-600'>
            Manage your product catalog, inventory levels, and product
            information.
          </p>
          <div className='rounded-lg bg-white p-4 shadow-sm'>
            <div className='mb-4 flex items-center justify-between'>
              <h4 className='font-medium'>Product List</h4>
              <button className='rounded-lg bg-blue-600 px-4 py-2 text-sm text-white'>
                Add Product
              </button>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between border-b py-2'>
                <span className='font-medium'>Wireless Headphones</span>
                <span className='text-green-600'>In Stock (45)</span>
              </div>
              <div className='flex items-center justify-between border-b py-2'>
                <span className='font-medium'>Smart Watch</span>
                <span className='text-yellow-600'>Low Stock (3)</span>
              </div>
              <div className='flex items-center justify-between py-2'>
                <span className='font-medium'>Laptop Stand</span>
                <span className='text-red-600'>Out of Stock</span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='orders'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Order Management</h3>
          <p className='mb-4 text-gray-600'>
            Track and manage customer orders, process refunds, and handle
            shipping.
          </p>
          <div className='space-y-3'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-medium'>Order #ORD-001</h4>
                  <p className='text-sm text-gray-600'>Customer: John Doe</p>
                </div>
                <span className='rounded-full bg-green-100 px-3 py-1 text-sm text-green-800'>
                  Completed
                </span>
              </div>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-medium'>Order #ORD-002</h4>
                  <p className='text-sm text-gray-600'>Customer: Jane Smith</p>
                </div>
                <span className='rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800'>
                  Processing
                </span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='customers'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Customer Management</h3>
          <p className='mb-4 text-gray-600'>
            View customer information, order history, and manage customer
            relationships.
          </p>
          <div className='rounded-lg bg-white p-4 shadow-sm'>
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center'>
                <h4 className='text-2xl font-bold text-blue-600'>1,234</h4>
                <p className='text-sm text-gray-600'>Total Customers</p>
              </div>
              <div className='text-center'>
                <h4 className='text-2xl font-bold text-green-600'>856</h4>
                <p className='text-sm text-gray-600'>Active Customers</p>
              </div>
              <div className='text-center'>
                <h4 className='text-2xl font-bold text-purple-600'>378</h4>
                <p className='text-sm text-gray-600'>New This Month</p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='analytics'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Analytics & Reports</h3>
          <p className='mb-4 text-gray-600'>
            Detailed insights into your store performance, customer behavior,
            and sales trends.
          </p>
          <div className='rounded-lg bg-white p-4 shadow-sm'>
            <h4 className='mb-3 font-medium'>Sales Performance</h4>
            <div className='flex h-32 items-center justify-center rounded-lg bg-gray-100'>
              <span className='text-gray-500'>Chart placeholder</span>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='inventory'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Inventory Management</h3>
          <p className='mb-4 text-gray-600'>
            Track stock levels, manage suppliers, and monitor inventory
            turnover.
          </p>
          <div className='space-y-3'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Electronics</span>
                <span className='text-sm text-gray-600'>245 items</span>
              </div>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Clothing</span>
                <span className='text-sm text-gray-600'>189 items</span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='marketing'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Marketing Tools</h3>
          <p className='mb-4 text-gray-600'>
            Create campaigns, manage promotions, and track marketing
            performance.
          </p>
          <div className='grid grid-cols-2 gap-4'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='mb-2 font-medium'>Email Campaigns</h4>
              <p className='text-sm text-gray-600'>
                Send targeted emails to customers
              </p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='mb-2 font-medium'>Social Media</h4>
              <p className='text-sm text-gray-600'>
                Manage social media presence
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='settings'>
        <div className='rounded-lg bg-gray-100 p-6'>
          <h3 className='mb-3 text-xl font-semibold'>Store Settings</h3>
          <p className='mb-4 text-gray-600'>
            Configure your store settings, payment methods, and shipping
            options.
          </p>
          <div className='space-y-4'>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='mb-2 font-medium'>General Settings</h4>
              <p className='text-sm text-gray-600'>
                Store name, description, and contact information
              </p>
            </div>
            <div className='rounded-lg bg-white p-4 shadow-sm'>
              <h4 className='mb-2 font-medium'>Payment Settings</h4>
              <p className='text-sm text-gray-600'>
                Configure payment gateways and methods
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}
