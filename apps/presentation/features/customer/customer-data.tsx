'use client'

import { Button } from '@/components/ui/button'
import { useCustomer } from './customer-use-customer'
import { CustomerResponse } from '@core/contracts/customer/customer'
import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'
import { formatSalutation } from './lib/customer-data-utils'
import { CustomerDataForm } from './components/customer-data-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import PencilIcon from '@/public/icons/pencil.svg'
import { Card } from '@/components/ui/card'

interface CustomerField {
  key: keyof CustomerResponse
  label: string
  formatter?: (value: CustomerResponse[keyof CustomerResponse]) => string
}

const CustomerFieldDisplay: FC<{
  field: CustomerField
  value: CustomerResponse[keyof CustomerResponse]
}> = ({ field, value }) => {
  return (
    <div className='flex flex-col gap-x-1 max-sm:mb-2 sm:flex-row'>
      <dt className='font-semibold text-gray-500'>{field.label}:</dt>
      <dd className='text-gray-900'>
        {field.formatter ? field.formatter(value) : String(value)}
      </dd>
    </div>
  )
}

export const CustomerData: FC = () => {
  const t = useTranslations('account.myAccount')
  const { customer, isLoading } = useCustomer()
  const [open, setOpen] = useState(false)
  const [formState, setFormState] = useState({
    isDirty: false,
    isPending: false,
  })

  if (isLoading) {
    return <LoadingSpinner className='size-6' />
  }

  if (!customer) {
    return (
      <Card
        scheme='gray'
        className='w-1/2'
      >
        {t('noCustomerData')}
      </Card>
    )
  }

  const customerFields: CustomerField[] = [
    customer.email && { key: 'email', label: t('customerData.email') },
    customer.salutation && {
      key: 'salutation',
      label: t('customerData.salutation'),
      formatter: (value: string | undefined) => formatSalutation(value, t),
    },
    customer.firstName && {
      key: 'firstName',
      label: t('customerData.firstName'),
    },
    customer.lastName && { key: 'lastName', label: t('customerData.lastName') },
    customer.dateOfBirth && {
      key: 'dateOfBirth',
      label: t('customerData.dateOfBirth'),
    },
  ].filter(Boolean) as CustomerField[]

  return (
    <>
      <Card
        scheme='gray'
        className='xl:w-1/2'
      >
        <div className='mb-2 flex items-center justify-between'>
          <h2 className='text-lg font-bold'>{t('customerData.title')}</h2>
          <Button
            variant='primary'
            scheme='black'
            className='h-auto py-2'
            aria-label={t('customerData.edit')}
            onClick={() => setOpen(true)}
          >
            <PencilIcon className='size-4' />
            {t('edit')}
          </Button>
        </div>
        <dl>
          {customerFields.map((field) => (
            <CustomerFieldDisplay
              key={field.key}
              field={field}
              value={customer[field.key]}
            />
          ))}
        </dl>
      </Card>
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent
          className='w-full max-w-xl'
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>{t('customerData.title')}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <CustomerDataForm
              customer={customer}
              onSuccess={() => setOpen(false)}
              onStateChange={setFormState}
            />
          </SheetBody>
          <SheetFooter>
            <Button
              type='submit'
              form='customer-data-form'
              className='w-full'
              disabled={!formState.isDirty || formState.isPending}
            >
              {formState.isPending ? t('saving') : t('save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
