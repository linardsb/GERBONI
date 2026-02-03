import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack, stackVariants } from '@/components/elements/stack'

describe('Stack', () => {
  it('renders with default props', () => {
    render(<Stack data-testid="stack">Content</Stack>)
    const element = screen.getByTestId('stack')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Content')
  })

  it('has data-slot attribute', () => {
    render(<Stack data-testid="stack">Content</Stack>)
    const element = screen.getByTestId('stack')
    expect(element).toHaveAttribute('data-slot', 'stack')
  })

  it('applies base flex-col class', () => {
    render(<Stack data-testid="stack">Content</Stack>)
    const element = screen.getByTestId('stack')
    expect(element).toHaveClass('flex', 'flex-col')
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
      render(<Stack data-testid="stack" gap={gap}>Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default gap (md)', () => {
      render(<Stack data-testid="stack">Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveClass('gap-4')
    })
  })

  describe('align variants', () => {
    it.each([
      ['start', 'items-start'],
      ['center', 'items-center'],
      ['end', 'items-end'],
      ['stretch', 'items-stretch'],
    ] as const)('applies align=%s as %s', (align, expectedClass) => {
      render(<Stack data-testid="stack" align={align}>Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default align (stretch)', () => {
      render(<Stack data-testid="stack">Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveClass('items-stretch')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Stack data-testid="stack" className="custom-class">Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('flex', 'flex-col')
    })

    it('allows overriding default classes', () => {
      render(<Stack data-testid="stack" className="gap-10">Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveClass('gap-10')
    })
  })

  describe('props forwarding', () => {
    it('forwards additional props to div', () => {
      render(<Stack data-testid="stack" id="my-stack" aria-label="stack">Content</Stack>)
      const element = screen.getByTestId('stack')
      expect(element).toHaveAttribute('id', 'my-stack')
      expect(element).toHaveAttribute('aria-label', 'stack')
    })
  })

  describe('stackVariants', () => {
    it('exports variants for external use', () => {
      expect(stackVariants).toBeDefined()
      expect(typeof stackVariants).toBe('function')
    })

    it('generates correct classes with variant function', () => {
      const classes = stackVariants({ gap: 'section', align: 'center' })
      expect(classes).toContain('gap-section')
      expect(classes).toContain('items-center')
    })
  })
})
