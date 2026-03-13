import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/ui/button'
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
          <Button>Open Drawer</Button>
        </DrawerTrigger>
        <DrawerContent
          scheme={contentScheme}
          showCloseButton={showCloseButton}
        >
          <DrawerHeader>
            <DrawerTitle>Wählen Sie Ihre Versandart</DrawerTitle>
            <VisuallyHidden>
              <DrawerDescription>
                Setzen Sie Ihr tägliches Aktivitätsziel.
              </DrawerDescription>
            </VisuallyHidden>
          </DrawerHeader>
          <div className='flex flex-col gap-4 px-4'>
            <p>
              Unsere Versandoptionen sind darauf ausgelegt, Ihnen Flexibilität
              und Komfort zu bieten. Wählen Sie zwischen Standardversand, der
              3-5 Werktage dauert, oder Expressversand für eine schnellere
              Lieferung innerhalb von 1-2 Werktagen.
            </p>
            <p>
              Alle Bestellungen werden sorgfältig verpackt und sind vollständig
              versichert. Verfolgen Sie Ihre Sendung in Echtzeit über unser
              spezielles Tracking-Portal.
            </p>
          </div>
          <DrawerFooter className='md:flex-row md:justify-between'>
            <Button className='md:flex-1'>Submit</Button>
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
