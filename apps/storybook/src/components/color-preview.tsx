import React from 'react'

interface ColorSwatchProps {
  name: string
  value: string
  className?: string
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  name,
  value,
  className = '',
}) => (
  <div className='flex flex-col items-center space-y-2'>
    <div
      className={`size-16 rounded-lg border border-gray-200 ${className}`}
      style={{ backgroundColor: value }}
    />
    <div className='text-center'>
      <div className='text-sm font-medium text-gray-900'>{name}</div>
      <div className='text-xs text-gray-500'>{value}</div>
    </div>
  </div>
)

export const ColorPreview: React.FC = () => {
  return (
    <div className='min-h-screen bg-white p-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='mb-2 text-2xl font-bold text-gray-900 uppercase'>
          SHOPIN COLOR SYSTEM
        </h1>
        <p className='mb-4 text-gray-600'>
          Complete design token system mapped to shadcn/ui conventions
        </p>
        <div className='h-px bg-gray-300'></div>
      </div>

      {/* Shopin Brand Colors */}
      <div className='mb-12'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>
          Shopin Brand Colors
        </h2>
        <div className='grid grid-cols-3 gap-6'>
          <ColorSwatch
            name='Primary'
            value='var(--color-primary)'
          />
          <ColorSwatch
            name='Secondary'
            value='var(--color-secondary)'
          />
          <ColorSwatch
            name='Accent'
            value='var(--color-accent)'
          />
        </div>
      </div>

      {/* Additional Shopin Colors */}
      <div className='mb-12'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>
          Additional Shopin Colors
        </h2>
        <div className='grid grid-cols-4 gap-4'>
          <ColorSwatch
            name='Green 100'
            value='var(--color-green-100)'
          />
          <ColorSwatch
            name='Green 700'
            value='var(--color-green-700)'
          />
          <ColorSwatch
            name='Blue 500'
            value='var(--color-blue-500)'
          />
          <ColorSwatch
            name='Lime 500'
            value='var(--color-lime-500)'
          />
          <ColorSwatch
            name='Orange 100'
            value='var(--color-orange-100)'
          />
          <ColorSwatch
            name='Orange 500'
            value='var(--color-orange-500)'
          />
          <ColorSwatch
            name='Red 200'
            value='var(--color-red-200)'
          />
          <ColorSwatch
            name='Red 400'
            value='var(--color-red-400)'
          />
          <ColorSwatch
            name='Red 600'
            value='var(--color-red-600)'
          />
          <ColorSwatch
            name='Sky 100'
            value='var(--color-sky-100)'
          />
          <ColorSwatch
            name='White'
            value='var(--color-white)'
          />
        </div>
      </div>

      {/* Shopin Semantic Colors */}
      <div className='mb-12'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>
          Shopin Semantic Colors
        </h2>
        <div className='grid grid-cols-4 gap-4'>
          <ColorSwatch
            name='Success'
            value='var(--color-success)'
          />
          <ColorSwatch
            name='Warning'
            value='var(--color-warning)'
          />
          <ColorSwatch
            name='Error'
            value='var(--color-error)'
          />
          <ColorSwatch
            name='Info'
            value='var(--color-info)'
          />
        </div>
      </div>

      {/* Shopin Gray Scale */}
      <div className='mb-12'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>
          Shopin Gray Scale
        </h2>
        <div className='grid grid-cols-5 gap-4'>
          <ColorSwatch
            name='Gray 50'
            value='var(--color-gray-50)'
          />
          <ColorSwatch
            name='Gray 100'
            value='var(--color-gray-100)'
          />
          <ColorSwatch
            name='Gray 200'
            value='var(--color-gray-200)'
          />
          <ColorSwatch
            name='Gray 300'
            value='var(--color-gray-300)'
          />
          <ColorSwatch
            name='Gray 400'
            value='var(--color-gray-400)'
          />
          <ColorSwatch
            name='Gray 500'
            value='var(--color-gray-500)'
          />
          <ColorSwatch
            name='Gray 600'
            value='var(--color-gray-600)'
          />
          <ColorSwatch
            name='Gray 700'
            value='var(--color-gray-700)'
          />
          <ColorSwatch
            name='Gray 800'
            value='var(--color-gray-800)'
          />
          <ColorSwatch
            name='Gray 900'
            value='var(--color-gray-900)'
          />
        </div>
      </div>
    </div>
  )
}
