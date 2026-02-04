import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  cardVariants,
  cardContentVariants,
} from '@/components/elements/card'

describe('Card', () => {
  it('renders with default props', () => {
    render(<Card data-testid="card">Content</Card>)
    const element = screen.getByTestId('card')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Content')
  })

  it('has data-slot attribute', () => {
    render(<Card data-testid="card">Content</Card>)
    const element = screen.getByTestId('card')
    expect(element).toHaveAttribute('data-slot', 'card')
  })

  it('applies base classes', () => {
    render(<Card data-testid="card">Content</Card>)
    const element = screen.getByTestId('card')
    expect(element).toHaveClass('bg-card', 'text-card-foreground', 'flex', 'flex-col')
  })

  describe('variant prop', () => {
    it.each([
      ['default', 'border', 'shadow-sm'],
      ['outline', 'border-2'],
      ['ghost', 'border-transparent'],
      ['elevated', 'shadow-md'],
      ['muted', 'bg-surface-muted'],
    ] as const)('applies variant=%s', (variant, ...expectedClasses) => {
      render(<Card data-testid="card" variant={variant}>Content</Card>)
      const element = screen.getByTestId('card')
      expectedClasses.forEach((cls) => {
        expect(element).toHaveClass(cls)
      })
    })

    it('includes data-variant attribute', () => {
      render(<Card data-testid="card" variant="elevated">Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveAttribute('data-variant', 'elevated')
    })
  })

  describe('padding prop', () => {
    it.each([
      ['none', 'p-0'],
      ['sm', 'p-4'],
      ['md', 'p-6'],
      ['lg', 'p-8'],
    ] as const)('applies padding=%s as %s', (padding, expectedClass) => {
      render(<Card data-testid="card" padding={padding}>Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default padding (none)', () => {
      render(<Card data-testid="card">Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass('p-0')
    })
  })

  describe('gap prop', () => {
    it.each([
      ['none', 'gap-0'],
      ['sm', 'gap-2'],
      ['md', 'gap-4'],
      ['lg', 'gap-6'],
      ['section', 'gap-section'],
    ] as const)('applies gap=%s as %s', (gap, expectedClass) => {
      render(<Card data-testid="card" gap={gap}>Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default gap (lg)', () => {
      render(<Card data-testid="card">Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass('gap-6')
    })
  })

  describe('radius prop', () => {
    it.each([
      ['none', 'rounded-none'],
      ['sm', 'rounded-sm'],
      ['md', 'rounded-md'],
      ['lg', 'rounded-lg'],
      ['xl', 'rounded-xl'],
    ] as const)('applies radius=%s as %s', (radius, expectedClass) => {
      render(<Card data-testid="card" radius={radius}>Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default radius (card)', () => {
      render(<Card data-testid="card">Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass('rounded-card')
    })
  })

  describe('className merging', () => {
    it('merges custom className with variants', () => {
      render(<Card data-testid="card" className="custom-class">Content</Card>)
      const element = screen.getByTestId('card')
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('bg-card')
    })
  })
})

describe('CardHeader', () => {
  it('renders with data-slot', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const element = screen.getByTestId('header')
    expect(element).toHaveAttribute('data-slot', 'card-header')
  })

  it('applies grid layout classes', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const element = screen.getByTestId('header')
    expect(element).toHaveClass('grid')
  })

  it('applies gap-element for spacing', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const element = screen.getByTestId('header')
    expect(element).toHaveClass('gap-element')
  })

  describe('padding prop', () => {
    it.each([
      ['none', 'px-0'],
      ['sm', 'px-4'],
      ['md', 'px-6'],
      ['lg', 'px-8'],
    ] as const)('applies padding=%s as %s', (padding, expectedClass) => {
      render(<CardHeader data-testid="header" padding={padding}>Header</CardHeader>)
      const element = screen.getByTestId('header')
      expect(element).toHaveClass(expectedClass)
    })

    it('applies default padding (md)', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)
      const element = screen.getByTestId('header')
      expect(element).toHaveClass('px-6')
    })
  })
})

describe('CardTitle', () => {
  it('renders with data-slot', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>)
    const element = screen.getByTestId('title')
    expect(element).toHaveAttribute('data-slot', 'card-title')
  })

  it('applies font-semibold', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>)
    const element = screen.getByTestId('title')
    expect(element).toHaveClass('font-semibold')
  })
})

describe('CardDescription', () => {
  it('renders with data-slot', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>)
    const element = screen.getByTestId('desc')
    expect(element).toHaveAttribute('data-slot', 'card-description')
  })

  it('applies muted text color', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>)
    const element = screen.getByTestId('desc')
    expect(element).toHaveClass('text-muted-foreground')
  })
})

describe('CardAction', () => {
  it('renders with data-slot', () => {
    render(<CardAction data-testid="action">Action</CardAction>)
    const element = screen.getByTestId('action')
    expect(element).toHaveAttribute('data-slot', 'card-action')
  })

  it('applies grid positioning', () => {
    render(<CardAction data-testid="action">Action</CardAction>)
    const element = screen.getByTestId('action')
    expect(element).toHaveClass('col-start-2', 'row-span-2')
  })
})

describe('CardContent', () => {
  it('renders with data-slot', () => {
    render(<CardContent data-testid="content">Content</CardContent>)
    const element = screen.getByTestId('content')
    expect(element).toHaveAttribute('data-slot', 'card-content')
  })

  describe('padding prop', () => {
    it.each([
      ['none', 'px-0'],
      ['sm', 'px-4'],
      ['md', 'px-6'],
      ['lg', 'px-8'],
    ] as const)('applies padding=%s as %s', (padding, expectedClass) => {
      render(<CardContent data-testid="content" padding={padding}>Content</CardContent>)
      const element = screen.getByTestId('content')
      expect(element).toHaveClass(expectedClass)
    })
  })
})

describe('CardFooter', () => {
  it('renders with data-slot', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const element = screen.getByTestId('footer')
    expect(element).toHaveAttribute('data-slot', 'card-footer')
  })

  it('applies flex layout', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const element = screen.getByTestId('footer')
    expect(element).toHaveClass('flex', 'items-center')
  })
})

describe('Variant exports', () => {
  it('exports cardVariants', () => {
    expect(cardVariants).toBeDefined()
    expect(typeof cardVariants).toBe('function')
  })

  it('exports cardContentVariants', () => {
    expect(cardContentVariants).toBeDefined()
    expect(typeof cardContentVariants).toBe('function')
  })

  it('cardVariants generates correct classes', () => {
    const classes = cardVariants({ variant: 'elevated', padding: 'lg', gap: 'section' })
    expect(classes).toContain('shadow-md')
    expect(classes).toContain('p-8')
    expect(classes).toContain('gap-section')
  })

  it('cardContentVariants generates correct classes', () => {
    const classes = cardContentVariants({ padding: 'lg' })
    expect(classes).toContain('px-8')
  })
})

describe('Card composition', () => {
  it('renders full card structure', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})
