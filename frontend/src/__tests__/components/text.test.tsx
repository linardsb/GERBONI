import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text, textVariants } from '@/components/elements/text'

describe('Text', () => {
  it('renders with default props', () => {
    render(<Text data-testid="text">Content</Text>)
    const element = screen.getByTestId('text')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Content')
  })

  it('has data-slot attribute', () => {
    render(<Text data-testid="text">Content</Text>)
    const element = screen.getByTestId('text')
    expect(element).toHaveAttribute('data-slot', 'text')
  })

  it('renders as p element by default', () => {
    render(<Text data-testid="text">Content</Text>)
    const element = screen.getByTestId('text')
    expect(element.tagName).toBe('P')
  })

  describe('as prop (semantic elements)', () => {
    it.each([
      ['h1', 'H1'],
      ['h2', 'H2'],
      ['h3', 'H3'],
      ['h4', 'H4'],
      ['h5', 'H5'],
      ['h6', 'H6'],
      ['p', 'P'],
      ['span', 'SPAN'],
      ['div', 'DIV'],
      ['label', 'LABEL'],
    ] as const)('renders as %s element', (as, expectedTag) => {
      render(<Text data-testid="text" as={as}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element.tagName).toBe(expectedTag)
    })
  })

  describe('display variants', () => {
    it.each([
      ['display-xl', 'text-display'],
      ['display-lg', 'text-display'],
      ['display-md', 'text-display'],
      ['display-sm', 'text-display'],
    ] as const)('applies variant=%s with text-display class', (variant, expectedClass) => {
      render(<Text data-testid="text" variant={variant}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass(expectedClass)
    })
  })

  describe('heading variants', () => {
    it.each([
      ['heading-xl', 'text-4xl', 'font-bold'],
      ['heading-lg', 'text-3xl', 'font-bold'],
      ['heading-md', 'text-2xl', 'font-bold'],
      ['heading-sm', 'text-xl', 'font-semibold'],
      ['heading-xs', 'text-lg', 'font-semibold'],
    ] as const)('applies variant=%s with size and weight classes', (variant, sizeClass, weightClass) => {
      render(<Text data-testid="text" variant={variant}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass(sizeClass)
      expect(element).toHaveClass(weightClass)
    })
  })

  describe('body variants', () => {
    it.each([
      ['body-lg', 'text-lg', 'leading-relaxed'],
      ['body-md', 'text-base', 'leading-relaxed'],
      ['body-sm', 'text-base', 'leading-relaxed'],
    ] as const)('applies variant=%s with size and leading classes', (variant, sizeClass, leadingClass) => {
      render(<Text data-testid="text" variant={variant}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass(sizeClass)
      expect(element).toHaveClass(leadingClass)
    })
  })

  describe('special variants', () => {
    it('applies label variant', () => {
      render(<Text data-testid="text" variant="label">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('text-label')
    })

    it('applies fine variant', () => {
      render(<Text data-testid="text" variant="fine">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('text-fine')
    })

    it('applies muted variant', () => {
      render(<Text data-testid="text" variant="muted">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('text-muted-foreground')
    })

    it('applies price variant', () => {
      render(<Text data-testid="text" variant="price">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('font-bold')
      expect(element).toHaveClass('text-primary')
    })
  })

  describe('status variants', () => {
    it.each([
      ['error', 'text-destructive'],
      ['success', 'text-success'],
      ['warning', 'text-warning'],
    ] as const)('applies variant=%s as %s', (variant, expectedClass) => {
      render(<Text data-testid="text" variant={variant}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass(expectedClass)
    })
  })

  describe('overlay variants', () => {
    it.each([
      ['overlay', 'text-overlay-foreground'],
      ['overlay-muted', 'text-overlay-foreground-muted'],
      ['overlay-subtle', 'text-overlay-foreground-subtle'],
    ] as const)('applies variant=%s as %s', (variant, expectedClass) => {
      render(<Text data-testid="text" variant={variant}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass(expectedClass)
    })
  })

  describe('align variants', () => {
    it.each([
      ['left', 'text-left'],
      ['center', 'text-center'],
      ['right', 'text-right'],
    ] as const)('applies align=%s as %s', (align, expectedClass) => {
      render(<Text data-testid="text" align={align}>Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass(expectedClass)
    })
  })

  describe('data-variant attribute', () => {
    it('includes data-variant when variant is specified', () => {
      render(<Text data-testid="text" variant="heading-lg">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveAttribute('data-variant', 'heading-lg')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Text data-testid="text" className="custom-class">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('custom-class')
    })

    it('allows overriding variant classes', () => {
      render(<Text data-testid="text" variant="body-md" className="text-2xl">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('text-2xl')
    })
  })

  describe('default variant', () => {
    it('applies body-md by default', () => {
      render(<Text data-testid="text">Content</Text>)
      const element = screen.getByTestId('text')
      expect(element).toHaveClass('text-base')
      expect(element).toHaveClass('leading-relaxed')
    })
  })

  describe('textVariants', () => {
    it('exports variants for external use', () => {
      expect(textVariants).toBeDefined()
      expect(typeof textVariants).toBe('function')
    })

    it('generates correct classes with variant function', () => {
      const classes = textVariants({ variant: 'heading-lg', align: 'center' })
      expect(classes).toContain('text-3xl')
      expect(classes).toContain('font-bold')
      expect(classes).toContain('text-center')
    })
  })
})
