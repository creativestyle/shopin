import React from 'react'

interface TypographyExampleProps {
  title: string
  className: string
  description: string
  children: React.ReactNode
}

const TypographyExample: React.FC<TypographyExampleProps> = ({
  title,
  className,
  description,
  children,
}) => (
  <div className='mb-8'>
    <div className='mb-2'>
      <h3 className='text-sm font-medium text-gray-700'>{title}</h3>
      <p className='text-xs text-gray-500'>{description}</p>
    </div>
    <div
      className={className}
      style={{ color: 'var(--color-gray-900)' }}
    >
      {children}
    </div>
  </div>
)

export const TypographyPreview: React.FC = () => {
  return (
    <div className='min-h-screen bg-white p-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900 uppercase'>
          TYPOGRAPHY
        </h1>
        <div className='h-px bg-gray-300'></div>
      </div>

      {/* Font Family */}
      <div className='mb-12'>
        <h2 className='mb-6 text-xl font-semibold text-gray-900'>
          Font Family
        </h2>
        <div className='grid grid-cols-1 gap-4'>
          <TypographyExample
            title='DM Sans'
            className='text-2xl font-bold'
            description='Primary font family with fallbacks'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='Fallback Fonts'
            className='text-lg'
            description='System fonts as fallback'
          >
            -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue,
            Arial, sans-serif
          </TypographyExample>
        </div>
      </div>

      {/* Figma Typography Token */}
      <div className='mb-12'>
        <h2 className='mb-6 text-xl font-semibold text-gray-900'>
          Figma Typography Token
        </h2>
        <div className='space-y-6'>
          <TypographyExample
            title='sm/Bold - 110% (Figma Token)'
            className='text-sm font-bold'
            description='Font: DM Sans, Style: Bold, Size: 14px, Weight: 700, Line Height: 1.1'
          >
            <div
              className='text-sm font-bold'
              style={{
                lineHeight: 'var(--leading-tight)',
                fontFamily: 'var(--font-base)',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </TypographyExample>
        </div>
      </div>

      {/* Font Sizes */}
      <div className='mb-12'>
        <h2 className='mb-6 text-xl font-semibold text-gray-900'>Font Sizes</h2>
        <div className='space-y-6'>
          <TypographyExample
            title='4XL (36px)'
            className='text-4xl font-bold'
            description='Large headings, hero text'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='3XL (30px)'
            className='text-3xl font-bold'
            description='Page headings'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='2XL (24px)'
            className='text-2xl font-bold'
            description='Section headings'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='XL (20px)'
            className='text-xl font-semibold'
            description='Subsection headings'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='LG (18px)'
            className='text-lg font-medium'
            description='Large body text'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='Base (16px)'
            className='text-base'
            description='Default body text'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='SM (14px)'
            className='text-sm'
            description='Small text, captions'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='XS (12px)'
            className='text-xs'
            description='Extra small text, labels'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
        </div>
      </div>

      {/* Font Weights */}
      <div className='mb-12'>
        <h2 className='mb-6 text-xl font-semibold text-gray-900'>
          Font Weights
        </h2>
        <div className='space-y-4'>
          <TypographyExample
            title='Bold (700)'
            className='text-xl font-bold'
            description='Strong emphasis, headings'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='Semibold (600)'
            className='text-xl font-semibold'
            description='Medium emphasis'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='Medium (500)'
            className='text-xl font-medium'
            description='Slight emphasis'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
          <TypographyExample
            title='Normal (400)'
            className='text-xl font-normal'
            description='Default weight'
          >
            The quick brown fox jumps over the lazy dog
          </TypographyExample>
        </div>
      </div>

      {/* Line Heights */}
      <div className='mb-12'>
        <h2 className='mb-6 text-xl font-semibold text-gray-900'>
          Line Heights
        </h2>
        <div className='space-y-4'>
          <TypographyExample
            title='Tight (1.1)'
            className='text-lg font-medium'
            description='Compact spacing, headings'
          >
            <div style={{ lineHeight: 'var(--leading-tight)' }}>
              The quick brown fox jumps over the lazy dog. This is a longer
              sentence to demonstrate the tight line height spacing.
            </div>
          </TypographyExample>
          <TypographyExample
            title='Normal (1.4)'
            className='text-lg font-medium'
            description='Standard body text'
          >
            <div style={{ lineHeight: 'var(--leading-normal)' }}>
              The quick brown fox jumps over the lazy dog. This is a longer
              sentence to demonstrate the normal line height spacing.
            </div>
          </TypographyExample>
          <TypographyExample
            title='Relaxed (1.6)'
            className='text-lg font-medium'
            description='Comfortable reading'
          >
            <div style={{ lineHeight: 'var(--leading-normal)' }}>
              The quick brown fox jumps over the lazy dog. This is a longer
              sentence to demonstrate the relaxed line height spacing.
            </div>
          </TypographyExample>
        </div>
      </div>

      {/* Usage Examples */}
      <div className='mb-12'>
        <h2 className='mb-6 text-xl font-semibold text-gray-900'>
          Usage Examples
        </h2>
        <div className='grid grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Headings</h3>
            <div className='space-y-2'>
              <h1
                className='text-3xl font-bold'
                style={{ color: 'var(--color-gray-900)' }}
              >
                Main Heading
              </h1>
              <h2
                className='text-2xl font-bold'
                style={{ color: 'var(--color-gray-900)' }}
              >
                Section Heading
              </h2>
              <h3
                className='text-xl font-semibold'
                style={{ color: 'var(--color-gray-900)' }}
              >
                Subsection Heading
              </h3>
            </div>
          </div>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Body Text</h3>
            <div className='space-y-2'>
              <p
                className='text-base'
                style={{ color: 'var(--color-gray-900)' }}
              >
                This is standard body text with normal weight and size.
              </p>
              <p
                className='text-sm'
                style={{ color: 'var(--color-gray-500)' }}
              >
                This is smaller text for secondary information.
              </p>
              <p
                className='text-xs'
                style={{ color: 'var(--color-gray-500)' }}
              >
                This is very small text for labels and captions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
