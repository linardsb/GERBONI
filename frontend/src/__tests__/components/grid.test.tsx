import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid, gridVariants, gridContainerVariants } from '@/components/elements/grid'

describe('Grid', () => {
  it('renders with default props', () => {
    render(<Grid data-testid="grid">Content</Grid>)
    const element = screen.getByTestId('grid')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Content')
  })

  it('has data-slot attribute', () => {
    render(<Grid data-testid="grid">Content</Grid>)
    const element = screen.getByTestId('grid')
    expect(element).toHaveAttribute('data-slot', 'grid')
  })

  it('applies base grid classes', () => {
    render(<Grid data-testid="grid">Content</Grid>)
    const element = screen.getByTestId('grid')
    expect(element).toHaveClass('grid', 'w-full')
  })

  describe('cols variants (viewport queries)', () => {
    it('applies cols=1', () => {
      render(<Grid data-testid="grid" cols={1}>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-1')
    })

    it('applies cols=2 with responsive breakpoints', () => {
      render(<Grid data-testid="grid" cols={2}>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-1')
      expect(element).toHaveClass('md:grid-cols-2')
    })

    it('applies cols=3 with responsive breakpoints', () => {
      render(<Grid data-testid="grid" cols={3}>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-1')
      expect(element).toHaveClass('md:grid-cols-2')
      expect(element).toHaveClass('lg:grid-cols-3')
    })

    it('applies cols=4 with responsive breakpoints', () => {
      render(<Grid data-testid="grid" cols={4}>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-1')
      expect(element).toHaveClass('sm:grid-cols-2')
      expect(element).toHaveClass('lg:grid-cols-4')
    })

    it('applies cols="2-3"', () => {
      render(<Grid data-testid="grid" cols="2-3">Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-2')
      expect(element).toHaveClass('lg:grid-cols-3')
    })

    it('applies cols="masonry"', () => {
      render(<Grid data-testid="grid" cols="masonry">Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-2')
      expect(element).toHaveClass('md:grid-cols-3')
      expect(element).toHaveClass('lg:grid-cols-4')
    })

    it('applies default cols (2)', () => {
      render(<Grid data-testid="grid">Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('md:grid-cols-2')
    })
  })

  describe('gap variants', () => {
    it.each([
      ['none', 'gap-0'],
      ['element', 'gap-element'],
      ['group', 'gap-group'],
      ['section', 'gap-section'],
    ] as const)('applies gap=%s as %s', (gap, expectedClass) => {
      render(<Grid data-testid="grid" gap={gap}>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies responsive gap for "sm"', () => {
      render(<Grid data-testid="grid" gap="sm">Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('gap-2')
      expect(element).toHaveClass('md:gap-4')
    })

    it('applies default gap (default)', () => {
      render(<Grid data-testid="grid">Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('gap-4')
      expect(element).toHaveClass('md:gap-6')
    })
  })

  describe('containerQuery prop', () => {
    it('defaults to false (uses viewport queries)', () => {
      render(<Grid data-testid="grid" cols={2}>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).not.toHaveAttribute('data-container-query')
      expect(element).toHaveClass('md:grid-cols-2')
    })

    it('uses container queries when true', () => {
      render(<Grid data-testid="grid" cols={2} containerQuery>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveAttribute('data-container-query', 'true')
      expect(element).toHaveClass('cq-md:grid-cols-2')
    })

    it('applies container query cols variants', () => {
      render(<Grid data-testid="grid" cols={4} containerQuery>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('grid-cols-1')
      expect(element).toHaveClass('cq-xs:grid-cols-2')
      expect(element).toHaveClass('cq-lg:grid-cols-3')
      expect(element).toHaveClass('cq-2xl:grid-cols-4')
    })

    it('applies container query gap variants', () => {
      render(<Grid data-testid="grid" gap="lg" containerQuery>Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('gap-6')
      expect(element).toHaveClass('cq-md:gap-8')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Grid data-testid="grid" className="custom-class">Content</Grid>)
      const element = screen.getByTestId('grid')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('grid', 'w-full')
    })
  })

  describe('exports', () => {
    it('exports gridVariants', () => {
      expect(gridVariants).toBeDefined()
      expect(typeof gridVariants).toBe('function')
    })

    it('exports gridContainerVariants', () => {
      expect(gridContainerVariants).toBeDefined()
      expect(typeof gridContainerVariants).toBe('function')
    })

    it('gridVariants generates correct classes', () => {
      const classes = gridVariants({ cols: 3, gap: 'section' })
      expect(classes).toContain('gap-section')
      expect(classes).toContain('lg:grid-cols-3')
    })

    it('gridContainerVariants generates container query classes', () => {
      const classes = gridContainerVariants({ cols: 3, gap: 'lg' })
      expect(classes).toContain('cq-xl:grid-cols-3')
      expect(classes).toContain('cq-md:gap-8')
    })
  })
})
