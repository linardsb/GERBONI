---
name: gerboni-frontend-design
description: |
  Frontend design system enforcement and component generation for Gerboni e-commerce.
  Use when: (1) Creating new React components, (2) Modifying existing UI code,
  (3) Adding styles or layout, (4) Reviewing frontend code for design compliance,
  (5) Implementing forms, modals, or data displays, (6) Adding animations/transitions.
  Enforces: CVA-based variants, semantic spacing tokens (page/section/group/element),
  OKLch color system, container queries, data-slot attributes, cn() utility,
  accessibility requirements, icon sizing, animation tokens.
  Prevents: inline styles, arbitrary Tailwind values (gap-[24px]), hardcoded colors,
  missing ARIA attributes, inconsistent icon sizes.
author: Claude Code
version: 2.0.0
date: 2026-02-02
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Gerboni Frontend Design System Skill

You are a frontend design system enforcer for the Gerboni e-commerce project. Your role is to ensure all React components follow the token-based design system, maintain accessibility, and prevent hardcoded styles.

## Table of Contents

1. [Problem](#problem)
2. [Trigger Conditions](#trigger-conditions)
3. [Token Reference](#token-reference)
4. [Animation Tokens](#animation-tokens)
5. [Component Patterns](#component-patterns)
6. [Component Templates](#component-templates)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Icon System](#icon-system)
9. [Responsive Design Decision Tree](#responsive-design-decision-tree)
10. [Error & Loading States](#error--loading-states)
11. [Anti-Pattern Detection](#anti-pattern-detection)
12. [Migration Checklist](#migration-checklist)
13. [Inter-Component Composition](#inter-component-composition)
14. [Automated Validation](#automated-validation)

---

## Problem

Design system drift occurs when developers:
- Use inline styles instead of Tailwind classes
- Use arbitrary Tailwind values (`gap-[24px]`) instead of semantic tokens (`gap-section`)
- Hardcode colors (`#ffffff`, `rgb(...)`) instead of semantic variables (`bg-background`)
- Create components without proper CVA structure
- Omit `data-slot` attributes needed for debugging and styling
- Forget to use `cn()` for class merging
- Ignore accessibility requirements
- Use inconsistent icon sizes
- Apply animations without using duration/easing tokens

---

## Trigger Conditions

Activate this skill when:
1. Creating a new React component in `frontend/src/components/`
2. Modifying existing component files (`.tsx`)
3. Adding or changing CSS classes in JSX
4. Reviewing pull requests for frontend changes
5. Implementing forms, modals, or data displays
6. Adding animations or transitions
7. User mentions: "component", "style", "layout", "spacing", "design system", "token", "accessible", "a11y"

---

## Token Reference

### Spacing Tokens (gap, padding, margin)

| Token | CSS Variable | Value | Use For |
|-------|--------------|-------|---------|
| `page` | `--space-page` | 3rem (48px) | Page-level sections, major divisions |
| `section` | `--space-section` | 2rem (32px) | Section boundaries, card groups |
| `group` | `--space-group` | 1rem (16px) | Related items, form fields |
| `element` | `--space-element` | 0.5rem (8px) | Inline items, tight spacing |

**Numeric Scale** (for fine control):
| Name | Class | Value |
|------|-------|-------|
| `none` | `gap-0` | 0 |
| `xs` | `gap-1` | 0.25rem (4px) |
| `sm` | `gap-2` | 0.5rem (8px) |
| `md` | `gap-4` | 1rem (16px) |
| `lg` | `gap-6` | 1.5rem (24px) |
| `xl` | `gap-8` | 2rem (32px) |
| `2xl` | `gap-12` | 3rem (48px) |

### Color Tokens

**Semantic Colors** (always prefer these):
```
bg-background          - Main page background
bg-foreground          - Inverted background
bg-card                - Card surfaces
bg-surface-muted       - Subtle section backgrounds
bg-surface-dark        - Dark sections (footer)
bg-primary             - Brand color (cyan)
bg-secondary           - Secondary actions
bg-muted               - Muted backgrounds
bg-accent              - Accent elements
bg-destructive         - Error/danger
bg-success             - Success states
bg-warning             - Warning states
```

**Text Colors**:
```
text-foreground              - Primary text
text-muted-foreground        - Secondary text
text-primary                 - Brand color text
text-destructive             - Error text
text-success                 - Success text
text-warning                 - Warning text
text-overlay-foreground      - White text on images
text-overlay-foreground-muted  - Semi-transparent white
text-overlay-foreground-subtle - More transparent white
```

**Border Colors**:
```
border-border          - Default borders
border-border-subtle   - Subtle borders
border-input           - Form inputs
border-ring            - Focus rings
```

### Container Query Breakpoints

Parent must have `cq-container` class. Use on children:

| Prefix | Min Width | Use For |
|--------|-----------|---------|
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

---

## Animation Tokens

### Duration Tokens

| Token | CSS Variable | Value | Use For |
|-------|--------------|-------|---------|
| `instant` | `--duration-instant` | 50ms | Micro-interactions, toggles |
| `fast` | `--duration-fast` | 150ms | Hover states, quick feedback |
| `normal` | `--duration-normal` | 300ms | Standard transitions |
| `slow` | `--duration-slow` | 500ms | Page transitions, modals |
| `slower` | `--duration-slower` | 700ms | Complex animations |

### Easing Tokens

| Token | CSS Variable | Value | Use For |
|-------|--------------|-------|---------|
| `default` | `--easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| `in` | `--easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerating |
| `out` | `--easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerating |
| `bounce` | `--easing-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy overshoot |
| `spring` | `--easing-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Spring-like |

### Usage Examples

```tsx
// Standard transition
className="transition-all duration-normal"

// Fast hover feedback
className="transition-colors duration-fast"

// Modal appearance
className="transition-opacity duration-slow ease-out"

// Bouncy button
className="transition-transform duration-normal hover:scale-105"
style={{ transitionTimingFunction: 'var(--easing-bounce)' }}
```

---

## Component Patterns

### CVA Component Template

Every component MUST follow this structure:

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const componentVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "...",
      secondary: "...",
    },
    size: {
      sm: "...",
      md: "...",
      lg: "...",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

function Component({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof componentVariants>) {
  return (
    <div
      data-slot="component"
      data-variant={variant}
      className={cn(componentVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </div>
  )
}

export { Component, componentVariants }
```

### Required Attributes

1. **`data-slot`**: Always include on root element
   ```tsx
   data-slot="card"
   data-slot="button"
   data-slot="stack"
   ```

2. **`data-variant`**: Include when variant prop exists
   ```tsx
   data-variant={variant}
   ```

3. **`className` merging**: Always use `cn()` from `@/lib/utils`
   ```tsx
   className={cn(componentVariants({ variant, className }))}
   ```

---

## Component Templates

### Form Field Template

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

### Modal/Dialog Template

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

### Data List Item Template

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

### Empty State Template

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

### Loading Skeleton Template

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

## Icon System

### Preferred Library

Use **Tabler Icons** (`@tabler/icons-react`) as the primary icon library.

```tsx
import { IconShoppingCart, IconUser, IconMenu2 } from "@tabler/icons-react"
```

### Standard Sizes

| Context | Class | Pixels | Usage |
|---------|-------|--------|-------|
| Inline text | `size-3` | 12px | Badges, status indicators |
| Button icons | `size-4` | 16px | Icon buttons, small UI |
| Standard | `size-5` | 20px | Navigation, default icons |
| Emphasis | `size-6` | 24px | Card headers, features |
| Feature | `size-8` | 32px | Marketing, highlights |
| Hero | `size-10` | 40px | Empty states, heroes |
| Large | `size-12` | 48px | Onboarding, large empty states |

### Icon Button Patterns

```tsx
// Small icon button
<Button size="icon-xs" variant="ghost">
  <IconX className="size-3" />
</Button>

// Default icon button
<Button size="icon" variant="outline">
  <IconMenu2 className="size-4" />
</Button>

// Large icon button
<Button size="icon-lg" variant="default">
  <IconPlus className="size-5" />
</Button>
```

### Accessibility for Icons

```tsx
// Decorative icon (hidden from screen readers)
<IconStar className="size-4" aria-hidden="true" />

// Meaningful icon (needs label)
<IconShoppingCart className="size-5" aria-label="Shopping cart" role="img" />

// Icon with visible text (hide icon)
<Button>
  <IconPlus className="size-4" aria-hidden="true" />
  Add to Cart
</Button>

// Icon-only button (needs aria-label)
<Button size="icon" aria-label="Close menu">
  <IconX className="size-4" />
</Button>
```

---

## Responsive Design Decision Tree

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

### Both? Use the `containerQuery` Prop

```tsx
// Component that works in both contexts
<Grid
  cols={4}
  gap="group"
  containerQuery={isInSidebar}  // Toggle based on context
>
```

---

## Error & Loading States

### Error Boundary Pattern

```tsx
// components/error-boundary.tsx
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

## Anti-Pattern Detection

### Patterns to Flag

| Pattern | Regex | Why It's Wrong | Correct Alternative |
|---------|-------|----------------|---------------------|
| Inline styles | `style=\{` | Bypasses design system | Use Tailwind classes |
| Arbitrary gap | `gap-\[\d+` | Not a semantic token | `gap-element/group/section/page` |
| Arbitrary padding | `p[xytblr]?-\[\d+` | Not a semantic token | Use padding variants |
| Arbitrary margin | `m[xytblr]?-\[\d+` | Not a semantic token | Use margin utilities |
| Hex colors | `#[0-9a-fA-F]{3,6}` | Hardcoded color | Use `bg-primary`, etc. |
| RGB colors | `rgb\(` | Hardcoded color | Use semantic tokens |
| Missing data-slot | Component without `data-slot` | Breaks debugging | Add `data-slot` |
| Template literal className | `className={\`` | Doesn't merge properly | Use `cn()` |

### Validation Function

```typescript
import { validateDesignSystem } from '@/lib/design-tokens'

const code = `<div style={{ margin: '16px' }} className="gap-[24px]">`
const violations = validateDesignSystem(code)
// Returns: [
//   { message: "Use Tailwind classes instead of inline styles", severity: "error" },
//   { message: "Use semantic gap tokens...", severity: "error" }
// ]
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
- [ ] Run validation script: `./validate-design-system.sh path/to/file.tsx`
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

### Standard Page Layout

```tsx
export default function Page() {
  return (
    <main>
      {/* Hero Section */}
      <Section background="muted" spacing="xl">
        <Container>
          <Stack gap="section" align="center">
            <Text variant="display-lg" as="h1">Title</Text>
            <Text variant="muted-lg">Subtitle</Text>
            <Row gap="group">
              <Button>Primary CTA</Button>
              <Button variant="outline">Secondary</Button>
            </Row>
          </Stack>
        </Container>
      </Section>

      {/* Content Section */}
      <Section spacing="lg">
        <Container>
          <Stack gap="section">
            <Text variant="heading-lg" as="h2">Section Title</Text>
            <Grid cols={4} gap="group">
              {items.map(item => (
                <Card key={item.id}>...</Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>
    </main>
  )
}
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

## Automated Validation

### PostToolUse Hook

A validation script runs after Write/Edit operations on component files.

**Script location**: `.claude/skills/gerboni-frontend-design/scripts/validate-design-system.sh`

**What it checks**:
- Inline styles (`style={{}}`)
- Arbitrary Tailwind values (`gap-[24px]`)
- Hardcoded colors (`#ffffff`, `rgb()`)
- Missing `data-slot` attributes
- Template literal `className` without `cn()`

**To run manually**:
```bash
./validate-design-system.sh frontend/src/components/MyComponent.tsx
```

### ESLint Integration (Recommended)

Add custom rules to `.eslintrc`:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "JSXAttribute[name.name='style']",
        "message": "Use Tailwind classes instead of inline styles"
      }
    ]
  }
}
```

---

## VSCode Snippets

VSCode snippets are available at `.vscode/gerboni.code-snippets`.

**Available snippets**:
| Prefix | Description |
|--------|-------------|
| `cva-component` | Full CVA component template |
| `cva-layout` | Layout component with gap variants |
| `section-page` | Page section with container |
| `hero-section` | Hero with title, subtitle, CTAs |
| `grid-products` | Product grid with cards |
| `form-field` | Accessible form field |
| `card-complete` | Full card with all sections |
| `empty-state` | Empty state with icon and CTA |
| `import-design` | All design system imports |
| `cn` | className with cn() |
| `data-slot` | data-slot attribute |

---

## Testing Patterns

### Component Test Template (Vitest + Testing Library)

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MyComponent } from "@/components/elements/my-component"

describe("MyComponent", () => {
  it("should render default variant", () => {
    render(<MyComponent>Content</MyComponent>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("should apply variant classes", () => {
    render(<MyComponent variant="secondary">Content</MyComponent>)
    const el = screen.getByText("Content")
    expect(el).toHaveAttribute("data-variant", "secondary")
  })

  it("should merge custom className via cn()", () => {
    render(<MyComponent className="custom-class">Content</MyComponent>)
    expect(screen.getByText("Content")).toHaveClass("custom-class")
  })

  it("should be accessible", () => {
    render(<MyComponent aria-label="test label">Content</MyComponent>)
    expect(screen.getByLabelText("test label")).toBeInTheDocument()
  })
})
```

### Component Test with API Mocking (MSW)

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { setupServer } from "msw/node"
import { http, HttpResponse } from "msw"

const server = setupServer(
  http.get("http://localhost:8000/api/products", () =>
    HttpResponse.json([{ id: 1, city_name: "Riga" }])
  )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("ProductList", () => {
  it("should display products after loading", async () => {
    render(<ProductList />)
    await waitFor(() => {
      expect(screen.getByText("Riga")).toBeInTheDocument()
    })
  })
})
```

### E2E Test Template (Playwright)

```ts
import { test, expect } from "@playwright/test"

test.describe("Feature Name", () => {
  test("should [expected behavior] when [condition]", async ({ page }) => {
    await page.goto("/en/products")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await page.getByRole("link", { name: /riga/i }).click()
    await expect(page).toHaveURL(/\/products\/\d+/)
  })
})
```

### Testing Conventions

- **File location**: `frontend/src/__tests__/` mirrors `src/` structure
- **Naming**: `should [expected behavior] when [condition]`
- **Coverage**: 80% threshold on branches, functions, lines, statements
- **MSW handlers**: Shared handlers in `src/__tests__/mocks/handlers.ts`
- **Test data**: Shared fixtures in `e2e/test-data.ts`
- **Run related**: `vitest related --run` for pre-commit hook

---

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Class Variance Authority](https://cva.style/docs)
- [Container Queries MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tabler Icons](https://tabler.io/icons)
- Project tokens: `frontend/src/app/globals.css`
- Design tokens TS: `frontend/src/lib/design-tokens.ts`
- Design system docs: `frontend/docs/DESIGN-SYSTEM.md`
