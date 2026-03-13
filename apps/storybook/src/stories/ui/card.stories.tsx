import type { Meta, StoryObj } from '@storybook/react'
import { Card } from '@/components/ui/card'
import CheckIcon from '@/public/icons/checkmark.svg'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    scheme: {
      control: { type: 'select' },
      options: ['white', 'gray', 'primary', 'success', 'info'],
    },
    children: {
      control: false,
    },
  },
  decorators: [
    (Story, context) => {
      // Pick background color based on card scheme
      const bg = context.args.scheme === 'white' ? '#f5f5f5' : '#fff'

      return (
        <div
          style={{
            backgroundColor: bg,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div className='max-w-[400px]'>
            <Story />
          </div>
        </div>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const CardContent = ({
  buttonVariant = 'primary',
  iconBg = 'bg-primary',
  iconColor = 'text-white',
}: {
  buttonVariant?: 'primary' | 'secondary'
  iconBg?: string
  iconColor?: string
}) => {
  return (
    <div className='flex flex-col items-center justify-center gap-4 text-center'>
      <div
        className={`inline-flex size-12 items-center justify-center rounded-full ${iconBg} ${iconColor}`}
      >
        <CheckIcon className='size-10' />
      </div>
      <h2 className='text-2xl leading-tight font-semibold'>Headline</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae quaerat
        officia deserunt deleniti tempore architecto sit illo non voluptates
        expedita!
      </p>
      <Button variant={buttonVariant}>Action</Button>
    </div>
  )
}

export const WhiteCard: Story = {
  args: {
    scheme: 'white',
    children: <CardContent />,
  },
}

export const GrayCard: Story = {
  args: {
    scheme: 'gray',
    children: <CardContent />,
  },
}

export const PrimaryCard: Story = {
  args: {
    scheme: 'primary',
    children: (
      <CardContent
        buttonVariant='secondary'
        iconBg='bg-white'
        iconColor='text-primary'
      />
    ),
  },
}

export const SuccessCard: Story = {
  args: {
    scheme: 'success',
    children: (
      <CardContent
        buttonVariant='secondary'
        iconBg='bg-white'
        iconColor='text-success'
      />
    ),
  },
}

export const InfoCard: Story = {
  args: {
    scheme: 'info',
    children: (
      <CardContent
        buttonVariant='secondary'
        iconBg='bg-white'
        iconColor='text-info'
      />
    ),
  },
}
