import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input, inputVariants } from '@/components/elements/input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input data-testid="input" />)
    const element = screen.getByTestId('input')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('INPUT')
  })

  it('has data-slot attribute', () => {
    render(<Input data-testid="input" />)
    const element = screen.getByTestId('input')
    expect(element).toHaveAttribute('data-slot', 'input')
  })

  describe('variant prop', () => {
    it.each([
      ['default', 'rounded-md'],
      ['minimal', 'border-b'],
      ['minimal-dark', 'text-overlay-foreground'],
    ] as const)('applies variant=%s', (variant, expectedClass) => {
      render(<Input data-testid="input" variant={variant} />)
      const element = screen.getByTestId('input')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default variant by default', () => {
      render(<Input data-testid="input" />)
      const element = screen.getByTestId('input')
      expect(element).toHaveClass('rounded-md')
    })

    it('includes data-variant attribute', () => {
      render(<Input data-testid="input" variant="minimal" />)
      const element = screen.getByTestId('input')
      expect(element).toHaveAttribute('data-variant', 'minimal')
    })
  })

  describe('type prop', () => {
    it.each([
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'search',
    ])('supports type=%s', (type) => {
      render(<Input data-testid="input" type={type} />)
      const element = screen.getByTestId('input')
      expect(element).toHaveAttribute('type', type)
    })
  })

  describe('base styles', () => {
    it('applies flex and width', () => {
      render(<Input data-testid="input" />)
      const element = screen.getByTestId('input')
      expect(element).toHaveClass('flex', 'w-full')
    })

    it('applies disabled styles', () => {
      render(<Input data-testid="input" disabled />)
      const element = screen.getByTestId('input')
      expect(element).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
      expect(element).toBeDisabled()
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Input data-testid="input" className="custom-class" />)
      const element = screen.getByTestId('input')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('rounded-md')
    })
  })

  describe('props forwarding', () => {
    it('forwards input props', () => {
      render(
        <Input
          data-testid="input"
          placeholder="Enter text"
          name="test-input"
          id="test-id"
          required
          aria-label="Test input"
        />
      )
      const element = screen.getByTestId('input')
      expect(element).toHaveAttribute('placeholder', 'Enter text')
      expect(element).toHaveAttribute('name', 'test-input')
      expect(element).toHaveAttribute('id', 'test-id')
      expect(element).toBeRequired()
      expect(element).toHaveAttribute('aria-label', 'Test input')
    })
  })

  describe('user interactions', () => {
    it('accepts user input', () => {
      render(<Input data-testid="input" />)
      const element = screen.getByTestId('input')

      fireEvent.change(element, { target: { value: 'Hello World' } })
      expect(element).toHaveValue('Hello World')
    })
  })

  describe('inputVariants', () => {
    it('exports variants for external use', () => {
      expect(inputVariants).toBeDefined()
      expect(typeof inputVariants).toBe('function')
    })

    it('generates correct classes with variant function', () => {
      const classes = inputVariants({ variant: 'minimal' })
      expect(classes).toContain('border-b')
      expect(classes).toContain('h-12')
    })
  })
})
