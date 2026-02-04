import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from '@/components/elements/badge'

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>New</Badge>)
    const element = screen.getByText('New')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('SPAN')
  })

  it('has data-slot attribute', () => {
    render(<Badge data-testid="badge">New</Badge>)
    const element = screen.getByTestId('badge')
    expect(element).toHaveAttribute('data-slot', 'badge')
  })

  describe('variant prop', () => {
    it.each([
      ['default', 'bg-primary'],
      ['secondary', 'bg-secondary'],
      ['destructive', 'bg-destructive'],
      ['outline', 'border-border'],
      ['ghost', '[a&]:hover:bg-accent'],
      ['link', 'text-primary'],
    ] as const)('applies variant=%s', (variant, expectedClass) => {
      render(<Badge data-testid="badge" variant={variant}>Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default variant by default', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass('bg-primary')
    })

    it('includes data-variant attribute', () => {
      render(<Badge data-testid="badge" variant="destructive">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveAttribute('data-variant', 'destructive')
    })
  })

  describe('base styles', () => {
    it('applies inline-flex and centering', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('applies rounded-full for pill shape', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass('rounded-full')
    })

    it('applies text-xs font size', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass('text-xs')
    })

    it('applies font-medium', () => {
      render(<Badge data-testid="badge">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass('font-medium')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Badge data-testid="badge" className="custom-class">Test</Badge>)
      const element = screen.getByTestId('badge')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('bg-primary')
    })
  })

  describe('asChild prop', () => {
    it('renders children as the badge when asChild is true', () => {
      render(
        <Badge asChild>
          <a href="/test">Link Badge</a>
        </Badge>
      )
      const element = screen.getByRole('link')
      expect(element.tagName).toBe('A')
      expect(element).toHaveAttribute('href', '/test')
      expect(element).toHaveClass('bg-primary')
    })
  })

  describe('badgeVariants', () => {
    it('exports variants for external use', () => {
      expect(badgeVariants).toBeDefined()
      expect(typeof badgeVariants).toBe('function')
    })

    it('generates correct classes with variant function', () => {
      const classes = badgeVariants({ variant: 'destructive' })
      expect(classes).toContain('bg-destructive')
      expect(classes).toContain('text-destructive-foreground')
    })

    it('generates correct default classes', () => {
      const classes = badgeVariants({})
      expect(classes).toContain('bg-primary')
    })
  })

  describe('badge content', () => {
    it('renders text content', () => {
      render(<Badge>Sale</Badge>)
      expect(screen.getByText('Sale')).toBeInTheDocument()
    })

    it('renders with icons', () => {
      render(
        <Badge data-testid="badge">
          <svg data-testid="icon" />
          With Icon
        </Badge>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })
  })
})
