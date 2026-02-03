import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Row, rowVariants } from '@/components/elements/row'

describe('Row', () => {
  it('renders with default props', () => {
    render(<Row data-testid="row">Content</Row>)
    const element = screen.getByTestId('row')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Content')
  })

  it('has data-slot attribute', () => {
    render(<Row data-testid="row">Content</Row>)
    const element = screen.getByTestId('row')
    expect(element).toHaveAttribute('data-slot', 'row')
  })

  it('applies base flex-row class', () => {
    render(<Row data-testid="row">Content</Row>)
    const element = screen.getByTestId('row')
    expect(element).toHaveClass('flex', 'flex-row')
  })

  describe('gap variants', () => {
    it.each([
      ['none', 'gap-0'],
      ['xs', 'gap-1'],
      ['sm', 'gap-2'],
      ['md', 'gap-4'],
      ['lg', 'gap-6'],
      ['xl', 'gap-8'],
      ['2xl', 'gap-12'],
      ['element', 'gap-element'],
      ['group', 'gap-group'],
      ['section', 'gap-section'],
      ['page', 'gap-page'],
    ] as const)('applies gap=%s as %s', (gap, expectedClass) => {
      render(<Row data-testid="row" gap={gap}>Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default gap (md)', () => {
      render(<Row data-testid="row">Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass('gap-4')
    })
  })

  describe('align variants', () => {
    it.each([
      ['start', 'items-start'],
      ['center', 'items-center'],
      ['end', 'items-end'],
      ['baseline', 'items-baseline'],
      ['stretch', 'items-stretch'],
    ] as const)('applies align=%s as %s', (align, expectedClass) => {
      render(<Row data-testid="row" align={align}>Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default align (center)', () => {
      render(<Row data-testid="row">Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass('items-center')
    })
  })

  describe('justify variants', () => {
    it.each([
      ['start', 'justify-start'],
      ['center', 'justify-center'],
      ['end', 'justify-end'],
      ['between', 'justify-between'],
      ['around', 'justify-around'],
      ['evenly', 'justify-evenly'],
    ] as const)('applies justify=%s as %s', (justify, expectedClass) => {
      render(<Row data-testid="row" justify={justify}>Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default justify (start)', () => {
      render(<Row data-testid="row">Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass('justify-start')
    })
  })

  describe('wrap variants', () => {
    it.each([
      ['nowrap', 'flex-nowrap'],
      ['wrap', 'flex-wrap'],
      ['wrap-reverse', 'flex-wrap-reverse'],
    ] as const)('applies wrap=%s as %s', (wrap, expectedClass) => {
      render(<Row data-testid="row" wrap={wrap}>Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default wrap (nowrap)', () => {
      render(<Row data-testid="row">Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass('flex-nowrap')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Row data-testid="row" className="custom-class">Content</Row>)
      const element = screen.getByTestId('row')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('flex', 'flex-row')
    })
  })

  describe('combined variants', () => {
    it('applies multiple variants together', () => {
      render(
        <Row data-testid="row" gap="section" align="end" justify="between" wrap="wrap">
          Content
        </Row>
      )
      const element = screen.getByTestId('row')
      expect(element).toHaveClass('gap-section')
      expect(element).toHaveClass('items-end')
      expect(element).toHaveClass('justify-between')
      expect(element).toHaveClass('flex-wrap')
    })
  })

  describe('rowVariants', () => {
    it('exports variants for external use', () => {
      expect(rowVariants).toBeDefined()
      expect(typeof rowVariants).toBe('function')
    })

    it('generates correct classes with variant function', () => {
      const classes = rowVariants({ gap: 'group', justify: 'between', wrap: 'wrap' })
      expect(classes).toContain('gap-group')
      expect(classes).toContain('justify-between')
      expect(classes).toContain('flex-wrap')
    })
  })
})
