import { render, screen } from '@testing-library/react'
import { EnergyEfficiencyClass } from '../energy-efficiency-class'

describe('EnergyEfficiencyClass', () => {
  describe('Label display', () => {
    it('displays energy class A', () => {
      render(<EnergyEfficiencyClass energyClass='A' />)

      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('Props forwarding', () => {
    it('forwards additional props to span element', () => {
      render(
        <EnergyEfficiencyClass
          energyClass='A'
          data-testid='energy-class'
        />
      )

      expect(screen.getByTestId('energy-class')).toBeInTheDocument()
    })

    it('forwards all HTML span attributes', () => {
      render(
        <EnergyEfficiencyClass
          energyClass='A'
          id='energy-a'
          title='Energy Efficiency Class A'
          role='img'
          aria-label='Energy efficiency class A'
        />
      )

      const element = screen.getByText('A')
      expect(element).toHaveAttribute('id', 'energy-a')
      expect(element).toHaveAttribute('title', 'Energy Efficiency Class A')
      expect(element).toHaveAttribute('role', 'img')
      expect(element).toHaveAttribute('aria-label', 'Energy efficiency class A')
    })
  })
})
