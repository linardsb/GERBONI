import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/elements/button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const element = screen.getByRole('button')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Click me')
  })

  it('has data-slot attribute', () => {
    render(<Button>Click me</Button>)
    const element = screen.getByRole('button')
    expect(element).toHaveAttribute('data-slot', 'button')
  })

  it('renders as button element by default', () => {
    render(<Button>Click me</Button>)
    const element = screen.getByRole('button')
    expect(element.tagName).toBe('BUTTON')
  })

  describe('variant prop', () => {
    it.each([
      ['default', 'bg-primary'],
      ['destructive', 'bg-destructive'],
      ['outline', 'border'],
      ['secondary', 'bg-secondary'],
      ['ghost', 'hover:bg-accent'],
      ['link', 'text-primary'],
      ['minimal', 'bg-transparent'],
      ['minimal-light', 'text-overlay-foreground'],
      ['text-underline', 'underline'],
    ] as const)('applies variant=%s', (variant, expectedClass) => {
      render(<Button variant={variant}>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default variant by default', () => {
      render(<Button>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('bg-primary')
    })
  })

  describe('size prop', () => {
    it.each([
      ['default', 'h-9'],
      ['xs', 'h-6'],
      ['sm', 'h-8'],
      ['lg', 'h-10'],
      ['icon', 'size-9'],
      ['icon-xs', 'size-6'],
      ['icon-sm', 'size-8'],
      ['icon-lg', 'size-10'],
    ] as const)('applies size=%s', (size, expectedClass) => {
      render(<Button size={size}>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default size by default', () => {
      render(<Button>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('h-9')
    })
  })

  describe('data attributes', () => {
    it('includes data-variant', () => {
      render(<Button variant="secondary">Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveAttribute('data-variant', 'secondary')
    })

    it('includes data-size', () => {
      render(<Button size="lg">Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveAttribute('data-size', 'lg')
    })
  })

  describe('base styles', () => {
    it('applies inline-flex and centering', () => {
      render(<Button>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('applies transition', () => {
      render(<Button>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('transition-all')
    })

    it('applies disabled styles', () => {
      render(<Button disabled>Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Button className="custom-class">Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('bg-primary')
    })

    it('allows overriding variant classes', () => {
      render(<Button className="bg-green-500">Click me</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveClass('bg-green-500')
    })
  })

  describe('asChild prop', () => {
    it('renders children as the button when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      const element = screen.getByRole('link')
      expect(element.tagName).toBe('A')
      expect(element).toHaveAttribute('href', '/test')
      expect(element).toHaveClass('bg-primary')
    })
  })

  describe('props forwarding', () => {
    it('forwards button props', () => {
      render(<Button type="submit" disabled aria-label="Submit form">Submit</Button>)
      const element = screen.getByRole('button')
      expect(element).toHaveAttribute('type', 'submit')
      expect(element).toBeDisabled()
      expect(element).toHaveAttribute('aria-label', 'Submit form')
    })
  })

  describe('buttonVariants', () => {
    it('exports variants for external use', () => {
      expect(buttonVariants).toBeDefined()
      expect(typeof buttonVariants).toBe('function')
    })

    it('generates correct classes with variant function', () => {
      const classes = buttonVariants({ variant: 'destructive', size: 'lg' })
      expect(classes).toContain('bg-destructive')
      expect(classes).toContain('h-10')
    })

    it('can be used for link styling', () => {
      const classes = buttonVariants({ variant: 'outline', size: 'sm' })
      expect(classes).toContain('border')
      expect(classes).toContain('h-8')
    })
  })
})
