import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
  DialogClose,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'

// READ FULL API OPTIONS HERE: https://www.radix-ui.com/primitives/docs/components/dialog

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
  args: {},
}

export default meta
type Story = StoryObj<typeof meta>

const dialogTitle = 'Lorem ipsum dolor, sit amet consectetur adipisicing elit.'
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

const OutsideControlledDialog = () => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <DialogBody>
            <DialogDescription>{paragraph}</DialogDescription>
            <ShortParagraph />
          </DialogBody>
        </DialogContent>
      </Dialog>
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
                Simple dialog without header and footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Simple dialog without header and footer actions'
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button aria-label='Open simple dialog'>Open</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <VisuallyHidden>
                      <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                      </DialogHeader>
                    </VisuallyHidden>
                    <DialogBody>
                      <DialogDescription>{paragraph}</DialogDescription>
                      <ShortParagraph />
                    </DialogBody>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Dialog with header, without footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Dialog with header, without footer actions'
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button aria-label='Open dialog with header'>Open</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <DialogDescription>{paragraph}</DialogDescription>
                      <ShortParagraph />
                    </DialogBody>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Dialog with header and footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Dialog with header and footer actions'
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button aria-label='Open dialog with header and footer'>
                      Open
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <DialogDescription>{paragraph}</DialogDescription>
                      <ShortParagraph />
                    </DialogBody>
                    <DialogFooter>
                      <Button variant='secondary'>Any action</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Dialog with custom close button in the footer
              </th>
              <td
                className='px-6 py-4'
                aria-label='Dialog with custom close button in the footer actions'
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button aria-label='Open dialog with custom close button'>
                      Open
                    </Button>
                  </DialogTrigger>
                  <DialogContent showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <DialogDescription>{paragraph}</DialogDescription>
                      <ShortParagraph />
                    </DialogBody>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant='secondary'>Close Dialog</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </td>
            </tr>
            <tr className='border-b border-gray-200 bg-white'>
              <th
                scope='row'
                className='px-6 py-4 font-medium whitespace-nowrap text-gray-900'
              >
                Rich content dialog (scrollable)
              </th>
              <td
                className='px-6 py-4'
                aria-label='Rich content dialog (scrollable) actions'
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button aria-label='Open rich content dialog'>Open</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <DialogDescription>{paragraph}</DialogDescription>
                      <LongParagraph />
                      <ShortParagraph />
                      <LongParagraph />
                    </DialogBody>
                    <DialogFooter>
                      <div className='flex w-full gap-4 max-md:flex-col md:justify-end'>
                        <Button variant='secondary'>Cancel</Button>
                        <Button>Confirm</Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button aria-label='Open initially open dialog'>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <DialogBody>
            <DialogDescription>{paragraph}</DialogDescription>
            <ShortParagraph />
          </DialogBody>
        </DialogContent>
      </Dialog>
    )
  },
}

export const ControlledFromAnywhere: Story = {
  parameters: {
    layout: 'centered',
  },
  render: () => {
    return <OutsideControlledDialog />
  },
}
