import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

// Define the story args type to include all the props we want to control
type DrawerStoryArgs = {
  // Drawer root props (from vaul DrawerPrimitive.Root)
  defaultOpen?: boolean
  dismissible?: boolean
  modal?: boolean
  open?: boolean

  // DrawerContent props
  contentScheme?: 'white' | 'gray'
  showCloseButton?: boolean
}

const meta: Meta<DrawerStoryArgs> = {
  title: 'UI/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    // Drawer root props
    defaultOpen: {
      control: { type: 'boolean' },
      description:
        'The open state of the drawer when it is initially rendered (requires page refresh to apply).',
    },
    dismissible: {
      control: { type: 'boolean' },
      description:
        'Whether the drawer can be dismissed by clicking outside or pressing escape.',
    },
    modal: {
      control: { type: 'boolean' },
      description:
        'Whether the drawer should be modal (blocking interaction with the rest of the page).',
    },

    // DrawerContent props
    contentScheme: {
      control: { type: 'select' },
      options: ['gray', 'white'],
      description: 'Background color of the Drawer content',
      table: {
        category: 'Content',
      },
    },
    showCloseButton: {
      control: { type: 'boolean' },
      description: 'Whether to show the close button in the drawer content',
      table: {
        category: 'Content',
      },
    },
  },
}

export default meta
type Story = StoryObj<DrawerStoryArgs>

export const Default: Story = {
  parameters: {
    layout: 'centered',
  },
  render: (args) => {
    const {
      // Drawer root props
      defaultOpen,
      dismissible,
      modal,

      // DrawerContent props
      contentScheme = 'gray',
      showCloseButton = true,
    } = args

    return (
      <Drawer
        defaultOpen={defaultOpen}
        dismissible={dismissible}
        modal={modal}
      >
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent
          scheme={contentScheme}
          showCloseButton={showCloseButton}
        >
          <DrawerHeader>
            <DrawerTitle>Choose delivery</DrawerTitle>
            <VisuallyHidden>
              <DrawerDescription>
                Pick a shipping speed for this order. You can change the address
                from your basket before you pay.
              </DrawerDescription>
            </VisuallyHidden>
          </DrawerHeader>
          <div className='px-4'>
            <Card
              className='flex flex-col gap-4'
              scheme={contentScheme === 'gray' ? 'white' : 'gray'}
            >
              <p>
                Standard delivery usually leaves our warehouse within one
                business day and arrives in three to five working days,
                depending on your postcode. Express and nominated-day slots
                appear at checkout when carriers can offer them.
              </p>
              <p>
                Orders are packed to survive the journey and are insured in
                transit. You will get tracking as soon as the carrier scans the
                parcel; the first scan may appear on the evening of dispatch.
              </p>
            </Card>
          </div>
          <DrawerFooter className='md:flex-row md:justify-between'>
            <Button className='md:flex-1'>Continue</Button>
            <DrawerClose asChild>
              <Button
                variant='secondary'
                className='md:flex-1'
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  },
}
