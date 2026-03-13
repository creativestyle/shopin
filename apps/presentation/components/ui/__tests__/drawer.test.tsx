import { render, screen } from '@testing-library/react'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '../drawer'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      close: 'Close',
    }
    return translations[key] || key
  },
}))

// Mock window.matchMedia for vaul
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('Drawer', () => {
  it('renders without crashing', () => {
    render(
      <Drawer>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Test Title</DrawerTitle>
            <DrawerDescription>Test Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Open Drawer')).toBeInTheDocument()
  })

  it('renders all drawer components when open', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Test Title</DrawerTitle>
            <DrawerDescription>Test Description</DrawerDescription>
          </DrawerHeader>
          <div>Test Content</div>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Open Drawer')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getAllByText('Close')).toHaveLength(2) // Footer close button + screen reader text
  })

  it('renders DrawerContent with gray scheme', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent scheme='gray'>
          <DrawerHeader>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders DrawerContent with white scheme', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent scheme='white'>
          <DrawerHeader>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders DrawerContent with showCloseButton true by default', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('renders DrawerContent with showCloseButton false', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent showCloseButton={false}>
          <DrawerHeader>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  it('renders DrawerPortal component', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders with multiple children in DrawerContent', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
          <div>Content 1</div>
          <div>Content 2</div>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('renders with controlled open state', () => {
    render(
      <Drawer open>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Controlled Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByText('Controlled Title')).toBeInTheDocument()
  })
})
