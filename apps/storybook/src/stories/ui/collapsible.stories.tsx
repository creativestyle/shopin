import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

// Define the story args type to include all the props we want to control
type CollapsibleStoryArgs = {
  // Collapsible root props (from Radix CollapsiblePrimitive.Root)
  defaultOpen?: boolean
  bordered?: boolean
  modal?: boolean
  open?: boolean
  disabled?: boolean

  // CollapsibleTrigger props
  indicator?: boolean
}

// Create a wrapper component that can use hooks
const CollapsibleWrapper = (args: CollapsibleStoryArgs) => {
  const {
    // Collapsible root props
    defaultOpen,
    bordered,
    disabled,

    // CollapsibleTrigger props
    indicator,
  } = args

  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className='max-w-[650px] text-gray-500'>
      <Collapsible
        defaultOpen={defaultOpen}
        bordered={bordered}
        disabled={disabled}
        open={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
      >
        <CollapsibleTrigger indicator={indicator}>
          {panelTitle}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <PanelContent />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const BorderedCollapsibleWrapper = (args: CollapsibleStoryArgs) => {
  const {
    // Collapsible root props
    defaultOpen,
    disabled,

    // CollapsibleTrigger props
    indicator,
  } = args

  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className='max-w-[650px] text-gray-500'>
      <Collapsible
        defaultOpen={defaultOpen}
        bordered={true}
        disabled={disabled}
        open={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
      >
        <CollapsibleTrigger indicator={indicator}>
          {panelTitle}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <PanelContent />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const InitiallyOpenCollapsibleWrapper = (args: CollapsibleStoryArgs) => {
  const {
    // Collapsible root props
    defaultOpen,
    disabled,

    // CollapsibleTrigger props
    indicator,
  } = args

  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className='max-w-[650px] text-gray-500'>
      <Collapsible
        defaultOpen={defaultOpen}
        bordered={true}
        disabled={disabled}
        open={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
      >
        <CollapsibleTrigger indicator={indicator}>
          {panelTitle}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <PanelContent />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const CustomIndicatorCollapsibleWrapper = (args: CollapsibleStoryArgs) => {
  const {
    // Collapsible root props
    defaultOpen,
    bordered,
    disabled,
  } = args

  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className='max-w-[720px] text-gray-500'>
      <Collapsible
        defaultOpen={defaultOpen}
        bordered={bordered}
        disabled={disabled}
        open={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
      >
        <CollapsibleTrigger
          indicator={false}
          className='w-full justify-between'
        >
          {panelTitle}
          <ChevronDownIcon
            className={`size-6 shrink-0 self-center text-gray-950 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden='true'
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <PanelContent />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const meta: Meta<CollapsibleStoryArgs> = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  argTypes: {
    bordered: {
      control: { type: 'boolean' },
    },
    defaultOpen: {
      control: { type: 'boolean' },
    },
    open: {
      control: false,
    },
    disabled: {
      control: { type: 'boolean' },
    },
    indicator: {
      control: { type: 'boolean' },
    },
  },
}

const panelTitle = 'Produktmerkmale'
const PanelContent = () => {
  return (
    <>
      <p className='mb-4 text-gray-950'>Artikelnummer 07743</p>
      <p className='mb-4'>
        Der Rasenmäherroboter RM18 Okay mit programmierbarer Mähzeit und
        Regensensor erleichtert Ihnen die Arbeit im Garten. Gelände mit bis zu
        20 ° / 35 % meistert er ohne Probleme. Wir empfehlen Ihnen den
        Rasenmäher Roboter RM 18 Okay auf einer maximalen Fläche von 600 m²
        einzusetzen. Mit einem Schalleistungspegel LWA von 60dB(A) ist der
        Mähroboter zudem angenehm leise. Die Garantiedauer beträgt 5 Jahre.
      </p>
      <ul className='list-inside list-disc'>
        <li>Ideal für Rasenflächen bis zu 600 m².</li>
        <li>Bewältigt mühelos Steigungen von bis zu 20°/35%.</li>
        <li>
          Regen-Sensor: Unterbricht das Mähen bei Regen automatisch, um den
          Rasen zu schützen.
        </li>
        <li>
          Schnittbreite: 18 cm Schnittbreite für eine effiziente Abdeckung.
        </li>
        <li>
          Leiser Betrieb: Arbeitet mit einem niedrigen Geräuschpegel von 60
          dB(A) für minimale Belästigung.
        </li>
        <li>Garantie: 5 Jahre Garantie für eine sorgenfreie Nutzung.</li>
      </ul>
    </>
  )
}

export default meta
type Story = StoryObj<CollapsibleStoryArgs>

export const Default: Story = {
  render: (args) => <CollapsibleWrapper {...args} />,
}

export const Bordered: Story = {
  args: {
    bordered: true,
  },
  argTypes: {
    ...meta.argTypes,
    bordered: {
      control: false,
    },
  },
  render: (args) => <BorderedCollapsibleWrapper {...args} />,
}

export const InitiallyOpen: Story = {
  args: {
    bordered: true,
    defaultOpen: true,
  },
  argTypes: {
    ...meta.argTypes,
    defaultOpen: {
      control: false,
    },
  },
  render: (args) => <InitiallyOpenCollapsibleWrapper {...args} />,
}

export const CustomIndicator: Story = {
  argTypes: {
    ...meta.argTypes,
    indicator: {
      control: false,
    },
  },
  args: {
    indicator: false,
    bordered: true,
  },
  render: (args) => <CustomIndicatorCollapsibleWrapper {...args} />,
}
