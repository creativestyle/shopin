import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetBody,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

// READ FULL API OPTIONS HERE: https://www.radix-ui.com/primitives/docs/components/dialog
// For accessibility reasons the SheetTitle and SheetDescription components MUST be included in the SheetContent. To get rid of it you can wrap it in VisuallyHidden component.

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
}

export default meta
type Story = StoryObj<typeof meta>

const sheetTitle = 'Lorem ipsum dolor'
const paragraph = `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Velit dolore, quis repellendus dolor sapiente soluta, voluptas sequi architecto dignissimos consectetur optio iure error ipsam, nesciunt rerum animi adipisci officia libero placeat veritatis nulla aspernatur vitae. Reiciendis aliquam hic, laboriosam magnam quos iure doloremque maxime debitis eveniet sit, at minima soluta?`

const ShortParagraph = () => {
  return <p className='not-last:mb-[1em]'>{paragraph}</p>
}

const LongParagraph = () => {
  return (
    <p className='not-last:mb-[1em]'>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eveniet harum
      dolores asperiores neque cum quia dicta maxime veritatis. Consequatur hic
      sed debitis doloremque minus accusantium libero? Voluptas accusamus quam
      quidem vero quasi eos sunt quod cum laudantium quibusdam culpa nemo
      inventore iusto saepe, sequi animi corrupti excepturi obcaecati neque
      consequuntur? Assumenda veritatis, enim saepe, impedit aliquam consequatur
      eaque fugit, vero distinctio iusto omnis odit placeat doloribus quam
      magnam! Alias repellendus quam delectus tempora qui nisi exercitationem
      architecto doloribus consequatur corrupti. Atque labore ipsam ratione
      excepturi. Alias repudiandae obcaecati quod? Perspiciatis dolores omnis
      aspernatur tempora explicabo commodi libero voluptates modi vero fugiat
      vel eligendi dignissimos eum, quisquam deserunt earum asperiores non,
      quidem culpa quo. Eum fugiat dolorum sed. Similique repellat harum est
      minus. Necessitatibus, praesentium! Magnam deleniti necessitatibus
      possimus quidem. Dicta modi ad nemo. Dolorum, quas dolore? Accusantium
      dicta soluta rerum nostrum, consectetur quos impedit voluptate tenetur
      vero nobis mollitia iusto illo repudiandae vel. Numquam odit impedit
      distinctio ab facilis laboriosam, suscipit provident est. Corporis totam
      est, iste aliquid cupiditate illum facere vel soluta? Dolore distinctio
      vero vitae error voluptatem, alias aliquid molestias reiciendis cum.
      Voluptatum iste neque molestias facere consectetur nulla sequi. A illo
      cumque accusantium, debitis excepturi vel neque sint laboriosam culpa
      provident omnis esse at iusto. Voluptate consequatur libero possimus
      omnis. Obcaecati eaque ipsa ea accusamus. Magnam nisi consequatur modi et
      quibusdam dolorum cupiditate eligendi! Quia quo, rem itaque beatae nemo
      maxime ratione, illum, quasi quam vel suscipit velit consequatur totam sit
      quod officia pariatur iste. Eius repellat fugiat, distinctio consequuntur
      consectetur deleniti voluptas nulla quod esse eos velit labore quo
      molestiae corrupti officia atque quos. Laboriosam est deleniti laborum
      veritatis. Labore id expedita odit quidem fugit dolores velit
      exercitationem assumenda ipsa, nobis dolorum voluptatum provident pariatur
      unde. Aut dicta aliquam beatae veniam nemo aperiam aspernatur fuga
      assumenda!
    </p>
  )
}

const OutsideControlledSheet = () => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Sheet</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <SheetDescription>{paragraph}</SheetDescription>
            <ShortParagraph />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}

export const Showcase: Story = {
  render: () => {
    return (
      <div className='relative overflow-x-auto'>
        <table className='w-full text-left text-sm text-gray-500'>
          <thead className='bg-gray-100 text-xs uppercase'>
            <tr>
              <th
                scope='col'
                className='w-[70%] px-6 py-3'
              >
                Combination description
              </th>
              <th
                scope='col'
                className='px-6 py-3'
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Simple sheet without footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Simple sheet without footer'
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button aria-label='Open simple sheet'>Open</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{sheetTitle}</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                      <SheetDescription>{paragraph}</SheetDescription>
                      <ShortParagraph />
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Sheet with header and footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Sheet with header and footer actions'
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button aria-label='Open sheet with header and footer'>
                      Open
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{sheetTitle}</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                      <SheetDescription>{paragraph}</SheetDescription>
                      <ShortParagraph />
                    </SheetBody>
                    <SheetFooter>
                      <Button
                        variant='secondary'
                        className='w-full'
                      >
                        Button
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Sheet with custom close button in the footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Sheet with custom close button in the footer actions'
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button aria-label='Open sheet with custom close button'>
                      Open
                    </Button>
                  </SheetTrigger>
                  <SheetContent showCloseButton={false}>
                    <SheetHeader>
                      <SheetTitle>{sheetTitle}</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                      <SheetDescription>{paragraph}</SheetDescription>
                      <ShortParagraph />
                    </SheetBody>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button
                          variant='secondary'
                          className='w-full'
                        >
                          Close sheet
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Rich content sheet (scrollable)
              </th>
              <td
                className='px-6 py-4'
                aria-label='Rich content sheet (scrollable) actions'
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button aria-label='Open rich content sheet'>Open</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{sheetTitle}</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                      <SheetDescription>{paragraph}</SheetDescription>
                      <LongParagraph />
                      <ShortParagraph />
                      <LongParagraph />
                    </SheetBody>
                    <SheetFooter>
                      <div className='flex flex-col gap-2'>
                        <Button
                          variant='secondary'
                          className='w-full'
                        >
                          Cancel
                        </Button>
                        <Button className='w-full'>Confirm</Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Sheet appearing from the left side of the screen
              </th>
              <td
                className='px-6 py-4'
                aria-label='Sheet appearing from the left side of the screen actions'
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button aria-label='Open left-sided sheet'>Open</Button>
                  </SheetTrigger>
                  <SheetContent side='left'>
                    <SheetHeader>
                      <SheetTitle>{sheetTitle}</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                      <SheetDescription>{paragraph}</SheetDescription>
                      <ShortParagraph />
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
}

export const InitiallyOpen: Story = {
  parameters: {
    layout: 'centered',
  },
  render: () => {
    return (
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <Button aria-label='Open initially open sheet'>Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <SheetDescription>{paragraph}</SheetDescription>
            <ShortParagraph />
          </SheetBody>
        </SheetContent>
      </Sheet>
    )
  },
}

export const ControlledFromAnywhere: Story = {
  parameters: {
    layout: 'centered',
  },
  render: () => {
    return <OutsideControlledSheet />
  },
}
