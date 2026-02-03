# Gerboni Design System

A token-based design system built on Tailwind CSS 4, class-variance-authority (CVA), and OKLch colors.

## Philosophy

1. **Semantic tokens over arbitrary values** - Use `gap-section` instead of `gap-[32px]`
2. **Component variants over inline styles** - Configure via props, not `style={{}}`
3. **Container queries for component-level responsiveness** - Respond to container width, not viewport
4. **Data attributes for debugging** - Every component has `data-slot` for easy inspection

---

## Spacing Tokens

### Semantic Scale (Preferred)

Use these for consistent, meaningful spacing:

| Token | Tailwind Class | Value | Use For |
|-------|----------------|-------|---------|
| `page` | `gap-page`, `p-page`, `m-page` | 3rem (48px) | Major page sections, hero areas |
| `section` | `gap-section`, `p-section` | 2rem (32px) | Between sections, card groups |
| `group` | `gap-group`, `p-group` | 1rem (16px) | Related items, form field groups |
| `element` | `gap-element`, `p-element` | 0.5rem (8px) | Tight spacing, inline items |

### Numeric Scale (Fine Control)

| Name | Tailwind Class | Value |
|------|----------------|-------|
| `none` | `gap-0` | 0 |
| `xs` | `gap-1` | 0.25rem (4px) |
| `sm` | `gap-2` | 0.5rem (8px) |
| `md` | `gap-4` | 1rem (16px) |
| `lg` | `gap-6` | 1.5rem (24px) |
| `xl` | `gap-8` | 2rem (32px) |
| `2xl` | `gap-12` | 3rem (48px) |

### Usage Example

```tsx
// Good - semantic tokens
<Stack gap="section">
  <Card padding="md">
    <Stack gap="element">
      <Text>Title</Text>
      <Text>Description</Text>
    </Stack>
  </Card>
</Stack>

// Bad - arbitrary values
<div className="gap-[24px]">
  <div style={{ padding: '16px' }}>
    ...
  </div>
</div>
```

---

## Color Tokens

All colors use OKLch color space defined in `globals.css`.

### Background Colors

| Token | Class | Usage |
|-------|-------|-------|
| Background | `bg-background` | Main page background |
| Card | `bg-card` | Card surfaces |
| Surface Muted | `bg-surface-muted` | Subtle section backgrounds |
| Surface Dark | `bg-surface-dark` | Dark sections (footer) |
| Primary | `bg-primary` | Brand color (cyan) |
| Secondary | `bg-secondary` | Secondary actions |
| Muted | `bg-muted` | Muted backgrounds |
| Accent | `bg-accent` | Accent elements |
| Destructive | `bg-destructive` | Error/danger states |
| Success | `bg-success` | Success states |
| Warning | `bg-warning` | Warning states |

### Text Colors

| Token | Class | Usage |
|-------|-------|-------|
| Foreground | `text-foreground` | Primary text |
| Muted | `text-muted-foreground` | Secondary/helper text |
| Primary | `text-primary` | Brand color text, links |
| Destructive | `text-destructive` | Error messages |
| Success | `text-success` | Success messages |
| Warning | `text-warning` | Warning messages |
| Overlay | `text-overlay-foreground` | White text on images |
| Overlay Muted | `text-overlay-foreground-muted` | Semi-transparent white |
| Overlay Subtle | `text-overlay-foreground-subtle` | More transparent white |

### Border Colors

| Token | Class | Usage |
|-------|-------|-------|
| Border | `border-border` | Default borders |
| Border Subtle | `border-border-subtle` | Subtle dividers |
| Input | `border-input` | Form inputs |
| Ring | `border-ring` | Focus rings |

---

## Container Queries

Container queries allow components to respond to their container's width instead of the viewport.

### Setup

```tsx
// Parent needs cq-container class
<div className="cq-container">
  <Grid cols={4} containerQuery />
</div>

// Or use ResponsiveContainer component
<ResponsiveContainer>
  <Grid cols={4} containerQuery />
</ResponsiveContainer>
```

### Breakpoints

| Prefix | Min Width | Description |
|--------|-----------|-------------|
| `cq-3xs:` | 16rem (256px) | Tiny containers |
| `cq-2xs:` | 18rem (288px) | Very small |
| `cq-xs:` | 20rem (320px) | Small cards |
| `cq-sm:` | 24rem (384px) | Medium cards |
| `cq-md:` | 28rem (448px) | Standard cards |
| `cq-lg:` | 32rem (512px) | Large cards |
| `cq-xl:` | 36rem (576px) | Wide containers |
| `cq-2xl:` | 42rem (672px) | Full-width |
| `cq-3xl:` | 48rem (768px) | Tablet+ |
| `cq-4xl:` | 56rem (896px) | Desktop |
| `cq-5xl:` | 64rem (1024px) | Wide desktop |
| `cq-6xl:` | 72rem (1152px) | Full width |
| `cq-7xl:` | 80rem (1280px) | Maximum |

### Named Containers

For nested queries, use named containers:

```tsx
<div className="cq-container/card">
  <div className="cq-container/sidebar">
    ...
  </div>
</div>
```

Available names: `card`, `section`, `sidebar`, `main`, `grid`

---

## Components

### Layout Components

#### Stack

Vertical flex container with semantic gap control.

```tsx
import { Stack } from '@/components/elements/stack'

<Stack gap="section" align="center">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</Stack>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `element`, `group`, `section`, `page` | `md` | Vertical spacing |
| `align` | `start`, `center`, `end`, `stretch` | `stretch` | Cross-axis alignment |

#### Row

Horizontal flex container with alignment and wrapping control.

```tsx
import { Row } from '@/components/elements/row'

<Row gap="group" justify="between" wrap="wrap">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Row>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `gap` | Same as Stack | `md` | Horizontal spacing |
| `align` | `start`, `center`, `end`, `baseline`, `stretch` | `center` | Cross-axis alignment |
| `justify` | `start`, `center`, `end`, `between`, `around`, `evenly` | `start` | Main-axis alignment |
| `wrap` | `nowrap`, `wrap`, `wrap-reverse` | `nowrap` | Flex wrapping |

#### Grid

CSS grid with responsive column control.

```tsx
import { Grid } from '@/components/elements/grid'

// Viewport-based responsiveness (default)
<Grid cols={4} gap="group">
  {items.map(item => <Card key={item.id} />)}
</Grid>

// Container-based responsiveness
<ResponsiveContainer>
  <Grid cols={4} gap="group" containerQuery>
    {items.map(item => <Card key={item.id} />)}
  </Grid>
</ResponsiveContainer>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `cols` | `1`, `2`, `3`, `4`, `"2-3"`, `"masonry"` | `2` | Column count |
| `gap` | `none`, `sm`, `default`, `lg`, `xl`, `element`, `group`, `section` | `default` | Grid gap |
| `containerQuery` | `boolean` | `false` | Use container queries |

#### Section

Page section with background and vertical spacing.

```tsx
import { Section } from '@/components/elements/section'

<Section background="muted" spacing="lg">
  <Container>
    <Text variant="heading-lg">Section Title</Text>
  </Container>
</Section>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `background` | `default`, `muted`, `dark`, `primary` | `default` | Background color |
| `spacing` | `none`, `sm`, `md`, `lg`, `xl` | `lg` | Vertical padding |

#### Container

Max-width content wrapper with horizontal padding.

```tsx
import { Container } from '@/components/elements/container'

<Container size="lg" padding="md">
  {/* Content constrained to max-width */}
</Container>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `size` | `sm`, `md`, `lg`, `xl`, `full` | `lg` | Max-width |
| `padding` | `none`, `sm`, `md`, `lg` | `md` | Horizontal padding |

### Element Components

#### Text

Typography component with semantic variants.

```tsx
import { Text } from '@/components/elements/text'

<Text variant="display-lg" as="h1" align="center">
  Hero Title
</Text>

<Text variant="body-md">
  Paragraph content...
</Text>

<Text variant="muted-sm">
  Helper text
</Text>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `variant` | See Typography Variants table | `body-md` | Text styling |
| `as` | `p`, `span`, `h1`-`h6`, `div`, `label` | `p` | HTML element |
| `align` | `left`, `center`, `right` | - | Text alignment |

##### Typography Variants

| Category | Variants |
|----------|----------|
| Display | `display-xl`, `display-lg`, `display-md`, `display-sm` |
| Heading | `heading-xl`, `heading-lg`, `heading-md`, `heading-sm`, `heading-xs` |
| Body | `body-lg`, `body-md`, `body-sm` |
| Special | `label`, `fine`, `muted`, `muted-sm`, `muted-lg` |
| Price | `price`, `price-lg` |
| Status | `error`, `success`, `warning` |
| Overlay | `overlay`, `overlay-muted`, `overlay-subtle` |
| Links | `nav-link`, `link-primary` |

#### Button

Interactive button with variants and sizes.

```tsx
import { Button } from '@/components/elements/button'

<Button variant="default" size="lg">
  Primary Action
</Button>

<Button variant="outline" size="sm">
  Secondary
</Button>

<Button variant="ghost" size="icon">
  <IconMenu />
</Button>
```

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `variant` | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `minimal`, `minimal-light`, `text-underline` | `default` | Visual style |
| `size` | `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg` | `default` | Size |
| `asChild` | `boolean` | `false` | Render as Slot |

#### Card

Content container with compositional sub-components.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/elements/card'

<Card variant="default" radius="xl">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
    <CardAction>
      <Button size="icon-sm" variant="ghost">
        <IconDots />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent padding="md">
    Main content goes here
  </CardContent>
  <CardFooter padding="md">
    <Button>Action</Button>
  </CardFooter>
</Card>
```

##### Card Props

| Prop | Values | Default | Description |
|------|--------|---------|-------------|
| `variant` | `default`, `outline`, `ghost`, `elevated`, `muted` | `default` | Visual style |
| `padding` | `none`, `sm`, `md`, `lg` | `none` | Inner padding |
| `gap` | `none`, `sm`, `md`, `lg`, `section` | `lg` | Content gap |
| `radius` | `none`, `sm`, `md`, `lg`, `xl` | `xl` | Border radius |

##### Sub-component Props

`CardHeader`, `CardContent`, `CardFooter` accept:
- `padding`: `none`, `sm`, `md`, `lg` (default: `md`)

---

## Anti-Patterns

### ❌ Don't Use

```tsx
// Inline styles
<div style={{ marginTop: '16px', padding: '24px' }}>

// Arbitrary Tailwind values
<div className="gap-[24px] p-[16px] mt-[32px]">

// Hardcoded colors
<div className="bg-[#ff0000] text-[#333333]">
<div style={{ color: 'rgb(255, 255, 255)' }}>

// Missing data-slot
function MyComponent() {
  return <div className="...">  // No data-slot!
}

// Not using cn() for className
className={`${baseClass} ${variant}`}  // Use cn() instead
```

### ✅ Do Use

```tsx
// Semantic spacing tokens
<Stack gap="section">
  <Card padding="md">

// Component props for styling
<Button variant="primary" size="lg">

// Semantic color tokens
<div className="bg-primary text-foreground">

// Data-slot attribute
function MyComponent() {
  return <div data-slot="my-component" className={cn(...)}>
}

// cn() utility for className
className={cn(variants({ variant }), className)}
```

---

## Page Structure Example

```tsx
import { Section } from '@/components/elements/section'
import { Container } from '@/components/elements/container'
import { Stack } from '@/components/elements/stack'
import { Grid } from '@/components/elements/grid'
import { Row } from '@/components/elements/row'
import { Text } from '@/components/elements/text'
import { Button } from '@/components/elements/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/elements/card'

export default function ProductsPage() {
  return (
    <main>
      {/* Hero Section */}
      <Section background="muted" spacing="lg">
        <Container>
          <Stack gap="section" align="center">
            <Text variant="display-lg" as="h1" align="center">
              Our Collection
            </Text>
            <Text variant="muted-lg" align="center">
              Authentic Latvian heritage designs
            </Text>
            <Row gap="group">
              <Button variant="default" size="lg">Shop Now</Button>
              <Button variant="outline" size="lg">Learn More</Button>
            </Row>
          </Stack>
        </Container>
      </Section>

      {/* Products Grid */}
      <Section spacing="lg">
        <Container>
          <Stack gap="section">
            <Text variant="heading-lg" as="h2">Featured Products</Text>
            <Grid cols={4} gap="group">
              {products.map((product) => (
                <Card key={product.id} variant="default">
                  <CardContent padding="md">
                    <Stack gap="element">
                      <Text variant="heading-sm">{product.name}</Text>
                      <Text variant="muted-sm">{product.description}</Text>
                      <Text variant="price">${product.price}</Text>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>
    </main>
  )
}
```

---

## Animation Tokens

### Duration

| Token | CSS Variable | Value | Use For |
|-------|--------------|-------|---------|
| `instant` | `--duration-instant` | 50ms | Micro-interactions, toggles |
| `fast` | `--duration-fast` | 150ms | Hover states, quick feedback |
| `normal` | `--duration-normal` | 300ms | Standard transitions |
| `slow` | `--duration-slow` | 500ms | Page transitions, modals |
| `slower` | `--duration-slower` | 700ms | Complex animations |

### Easing

| Token | CSS Variable | Use For |
|-------|--------------|---------|
| `default` | `--easing-default` | Standard easing |
| `in` | `--easing-in` | Accelerating |
| `out` | `--easing-out` | Decelerating |
| `bounce` | `--easing-bounce` | Bouncy overshoot |
| `spring` | `--easing-spring` | Spring-like |

### Usage

```tsx
// Standard transition
<div className="transition-all duration-normal" />

// Fast hover
<button className="transition-colors duration-fast hover:bg-primary" />

// Custom easing (use CSS variable)
<div style={{ transitionTimingFunction: 'var(--easing-bounce)' }} />
```

---

## Icon System

### Preferred Library

Use **Tabler Icons** (`@tabler/icons-react`):

```tsx
import { IconShoppingCart, IconUser } from "@tabler/icons-react"
```

### Standard Sizes

| Context | Class | Pixels |
|---------|-------|--------|
| Inline text | `size-3` | 12px |
| Button icons | `size-4` | 16px |
| Standard | `size-5` | 20px |
| Emphasis | `size-6` | 24px |
| Feature | `size-8` | 32px |
| Hero | `size-10` | 40px |
| Large | `size-12` | 48px |

### Accessibility

```tsx
// Decorative (hide from screen readers)
<IconStar className="size-4" aria-hidden="true" />

// Icon-only button (needs label)
<Button size="icon" aria-label="Close menu">
  <IconX className="size-4" />
</Button>
```

---

## Component Templates

### Form Field

```tsx
<Stack gap="element">
  <Label htmlFor="fieldId">Field Label</Label>
  <Input
    id="fieldId"
    type="text"
    placeholder="Enter value..."
    value={value}
    onChange={(e) => setValue(e.target.value)}
    aria-invalid={errors?.fieldId ? true : undefined}
    aria-describedby={errors?.fieldId ? "fieldId-error" : undefined}
  />
  {errors?.fieldId && (
    <Text variant="error" id="fieldId-error">
      {errors.fieldId.message}
    </Text>
  )}
</Stack>
```

### Modal/Dialog

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text explaining the purpose.
      </DialogDescription>
    </DialogHeader>
    <Stack gap="group">
      {/* Dialog content */}
    </Stack>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Data List Item

```tsx
<Row justify="between" className="py-group border-b border-border-subtle">
  <Row gap="group">
    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
      <Icon className="size-5 text-muted-foreground" />
    </div>
    <Stack gap="none">
      <Text variant="body-md" className="font-medium">Title</Text>
      <Text variant="muted-sm">Subtitle</Text>
    </Stack>
  </Row>
  <Row gap="element">
    <Button size="icon-sm" variant="ghost">
      <IconEdit className="size-4" />
    </Button>
    <Button size="icon-sm" variant="ghost">
      <IconTrash className="size-4" />
    </Button>
  </Row>
</Row>
```

### Empty State

```tsx
<Stack gap="section" align="center" className="py-page">
  <div className="rounded-full bg-muted p-6">
    <IconPackage className="size-12 text-muted-foreground" />
  </div>
  <Stack gap="element" align="center">
    <Text variant="heading-sm">No items found</Text>
    <Text variant="muted" align="center">
      Try adjusting your search or filters.
    </Text>
  </Stack>
  <Button variant="default">Add New Item</Button>
</Stack>
```

### Loading Skeleton

```tsx
<Stack gap="group">
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</Stack>
```

---

## Accessibility Guidelines

### Required ARIA Attributes by Component Type

#### Buttons

```tsx
// Action buttons
<Button aria-label="Close dialog">
  <IconX className="size-4" />
</Button>

// Toggle buttons
<Button
  aria-pressed={isActive}
  aria-label={isActive ? "Disable feature" : "Enable feature"}
>
  Toggle
</Button>

// Loading buttons
<Button disabled aria-busy="true">
  <Spinner className="size-4" aria-hidden="true" />
  Loading...
</Button>
```

#### Form Inputs

```tsx
<Input
  id="email"
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : "email-hint"}
  aria-required="true"
/>
<Text id="email-hint" variant="muted-sm">We'll never share your email.</Text>
{errors.email && (
  <Text id="email-error" variant="error" role="alert">
    {errors.email.message}
  </Text>
)}
```

#### Dialogs/Modals

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description">Description text</p>
</div>
```

#### Navigation

```tsx
<nav aria-label="Main navigation">
  <ul role="list">
    <li><Link href="/" aria-current={isHome ? "page" : undefined}>Home</Link></li>
  </ul>
</nav>
```

### Keyboard Navigation Requirements

| Component | Required Keys |
|-----------|---------------|
| Button | `Enter`, `Space` to activate |
| Dialog | `Escape` to close, trap focus inside |
| Dropdown | `Arrow Up/Down` to navigate, `Enter` to select, `Escape` to close |
| Tabs | `Arrow Left/Right` to switch, `Home/End` for first/last |
| Menu | `Arrow Up/Down` to navigate, `Enter` to select |

### Focus Management

```tsx
// Auto-focus first input in modal
const inputRef = useRef<HTMLInputElement>(null)
useEffect(() => {
  if (open) inputRef.current?.focus()
}, [open])

// Return focus on close
const triggerRef = useRef<HTMLButtonElement>(null)
const handleClose = () => {
  setOpen(false)
  triggerRef.current?.focus()
}
```

### Color Contrast Requirements

OKLch colors in the design system are pre-validated for WCAG AA compliance:
- Normal text: 4.5:1 minimum contrast ratio
- Large text (18px+ or 14px bold): 3:1 minimum
- UI components: 3:1 minimum

**Do not** create custom colors without checking contrast.

---

## Responsive Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│           Need responsive layout?                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Where is the component used?  │
         └────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │ Sidebar  │   │   Card   │   │  Full-page   │
    │ Panel    │   │ Content  │   │   Layout     │
    └──────────┘   └──────────┘   └──────────────┘
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │ Container│   │ Container│   │   Viewport   │
    │ Queries  │   │ Queries  │   │   Queries    │
    │ (cq-*)   │   │ (cq-*)   │   │ (sm:, md:)   │
    └──────────┘   └──────────┘   └──────────────┘
```

### When to Use Viewport Queries (sm:, md:, lg:)

- **Page-level layouts**: Main content areas, navigation
- **Grid systems**: Product grids that span full width
- **Typography**: Hero text that needs viewport-relative sizing
- **Mobile-first designs**: Features that differ phone vs tablet vs desktop

```tsx
// Viewport-based grid
<Grid cols={4} gap="group">  {/* Uses md:, lg: breakpoints */}
```

### When to Use Container Queries (cq-*)

- **Card content**: Layout within a card that may be in different contexts
- **Sidebar content**: Components that might be in narrow or wide sidebars
- **Reusable widgets**: Components used in various container sizes
- **Nested layouts**: When parent size matters more than viewport

```tsx
// Container-based grid
<ResponsiveContainer>
  <Grid cols={4} gap="group" containerQuery>  {/* Uses cq-* breakpoints */}
</ResponsiveContainer>
```

---

## Error & Loading States

### Error Boundary Pattern

```tsx
"use client"

import { Component, type ReactNode } from "react"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"
import { Button } from "@/components/elements/button"
import { IconAlertTriangle } from "@tabler/icons-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Stack gap="section" align="center" className="py-page">
          <div className="rounded-full bg-destructive/10 p-6">
            <IconAlertTriangle className="size-12 text-destructive" />
          </div>
          <Stack gap="element" align="center">
            <Text variant="heading-sm">Something went wrong</Text>
            <Text variant="muted" align="center">
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>
          </Stack>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </Stack>
      )
    }

    return this.props.children
  }
}
```

### Loading Skeleton Patterns

```tsx
// Card skeleton
function CardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent padding="md">
        <Stack gap="element">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/4" />
        </Stack>
      </CardContent>
    </Card>
  )
}

// List skeleton
function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Stack gap="group">
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} gap="group" className="py-group">
          <Skeleton className="size-10 rounded-full" />
          <Stack gap="element" className="flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </Stack>
        </Row>
      ))}
    </Stack>
  )
}
```

### Toast Notification Patterns

```tsx
import { toast } from "sonner"

// Success
toast.success("Item added to cart")

// Error
toast.error("Failed to save changes", {
  description: "Please try again or contact support."
})

// With action
toast("Item removed", {
  action: {
    label: "Undo",
    onClick: () => restoreItem()
  }
})

// Loading state
const promise = saveData()
toast.promise(promise, {
  loading: "Saving...",
  success: "Saved successfully",
  error: "Failed to save"
})
```

### Form Validation Display

```tsx
// Inline validation
<Stack gap="element">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    className={cn(errors.email && "border-destructive")}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <Row gap="element" className="text-destructive">
      <IconAlertCircle className="size-4" aria-hidden="true" />
      <Text variant="error" id="email-error">
        {errors.email.message}
      </Text>
    </Row>
  )}
</Stack>

// Form-level errors
{formError && (
  <div className="rounded-md bg-destructive/10 p-group border border-destructive/20">
    <Row gap="group">
      <IconAlertTriangle className="size-5 text-destructive" />
      <Text variant="error">{formError}</Text>
    </Row>
  </div>
)}
```

---

## Migration Checklist

When refactoring existing code to use the design system:

### Step 1: Audit Current Component
- [ ] Identify all inline styles (`style={{}}`)
- [ ] Identify all arbitrary Tailwind values (`gap-[24px]`, `p-[16px]`)
- [ ] Identify all hardcoded colors
- [ ] Check for missing `data-slot` attributes
- [ ] Check for `className` without `cn()`

### Step 2: Replace Spacing
- [ ] Convert arbitrary gaps to semantic tokens
  - `gap-[8px]` → `gap-element` or `gap-2`
  - `gap-[16px]` → `gap-group` or `gap-4`
  - `gap-[32px]` → `gap-section` or `gap-8`
  - `gap-[48px]` → `gap-page` or `gap-12`
- [ ] Convert arbitrary padding to variants or standard classes
- [ ] Convert arbitrary margin to utilities

### Step 3: Replace Colors
- [ ] Replace hex colors with semantic tokens
- [ ] Replace RGB/HSL with semantic tokens
- [ ] Verify contrast ratios are maintained

### Step 4: Add Required Attributes
- [ ] Add `data-slot="component-name"` to root element
- [ ] Add `data-variant={variant}` if component has variants
- [ ] Wrap `className` with `cn()` utility

### Step 5: Add Accessibility
- [ ] Add required ARIA attributes
- [ ] Ensure keyboard navigation works
- [ ] Add `aria-label` to icon-only buttons
- [ ] Add `role` attributes where needed

### Step 6: Test
- [ ] Run component tests
- [ ] Run validation script
- [ ] Test keyboard navigation manually
- [ ] Test with screen reader

---

## Inter-Component Composition

### Page Structure Hierarchy

```
<main>
  └── <Section>              (background, vertical padding)
      └── <Container>        (max-width, horizontal padding)
          └── <Stack>        (vertical content flow)
              └── <Grid>     (multi-column layouts)
                  └── <Card> (content containers)
```

### Card Structure

```tsx
<Card variant="default">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction>
      <Button size="icon-sm" variant="ghost">...</Button>
    </CardAction>
  </CardHeader>
  <CardContent padding="md">
    <Stack gap="element">
      {/* Main content */}
    </Stack>
  </CardContent>
  <CardFooter padding="md">
    <Row justify="end" gap="element">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </Row>
  </CardFooter>
</Card>
```

### Form Structure

```tsx
<form onSubmit={handleSubmit}>
  <Stack gap="section">
    {/* Section 1 */}
    <Stack gap="group">
      <Stack gap="element">
        <Text variant="heading-sm" as="h3">Personal Info</Text>
        <Text variant="muted-sm">Your basic information</Text>
      </Stack>
      <Stack gap="group">
        <FormField name="firstName" label="First Name" />
        <FormField name="lastName" label="Last Name" />
        <FormField name="email" label="Email" type="email" />
      </Stack>
    </Stack>

    {/* Section 2 */}
    <Stack gap="group">
      <Stack gap="element">
        <Text variant="heading-sm" as="h3">Shipping</Text>
        <Text variant="muted-sm">Where should we send your order?</Text>
      </Stack>
      <Stack gap="group">
        <FormField name="address" label="Address" />
        <Row gap="group">
          <FormField name="city" label="City" />
          <FormField name="zip" label="ZIP Code" />
        </Row>
      </Stack>
    </Stack>

    {/* Actions */}
    <Row justify="end" gap="element">
      <Button type="button" variant="outline">Cancel</Button>
      <Button type="submit">Submit</Button>
    </Row>
  </Stack>
</form>
```

---

## Development

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

### Validating Design System Compliance

The `validateDesignSystem()` function in `src/lib/design-tokens.ts` can check code for violations:

```typescript
import { validateDesignSystem } from '@/lib/design-tokens'

const violations = validateDesignSystem(codeString)
if (violations.length > 0) {
  console.error('Design system violations:', violations)
}
```

---

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Class Variance Authority](https://cva.style/docs)
- [Container Queries MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [OKLch Color Space](https://oklch.com/)
