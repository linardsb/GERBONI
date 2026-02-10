# Frontend Layout Architecture Guide

Use when building page layouts, responsive grids, or spacing structures in the GERBONI frontend.

## Layout Component Hierarchy

```
Section          ← Full-width band (background + vertical spacing)
  Container      ← Centered max-width wrapper (horizontal padding)
    Stack/Row    ← Flex direction (vertical/horizontal)
      Grid       ← Multi-column responsive grid
        Card     ← Content container (padding + border)
```

All layout uses semantic components — never raw `div` with manual flex/grid classes.

## Step 1: Wrap in Section + Container

```tsx
// Full-width band with centered content
<Section spacing="default" background="muted">
  <Container size="2xl" padding="none">
    {/* Content here — max-w-7xl, responsive px */}
  </Container>
</Section>
```

**Section** controls vertical rhythm and background:
| spacing | Value | Use |
|---------|-------|-----|
| `none` | py-0 | Flush sections |
| `compact` | py-8 md:py-12 | Dense content |
| `default` | py-16 md:py-24 | Standard sections |
| `large` | py-24 md:py-32 | Hero / CTA |

**Container** sizes: `sm` (2xl) → `md` (4xl) → `lg` (5xl) → `xl` (6xl) → `2xl` (7xl, default) → `3xl` (90rem) → `full` (100%, 1.5% px). Never nest Containers. All add `px-4 sm:px-6 lg:px-8` except `full`.

## Step 2: Choose Direction with Stack or Row

```tsx
// Vertical layout — stacked content
<Stack gap="section" align="center">
  <Text variant="heading-lg">{t("title")}</Text>
  <Text variant="body-md">{t("subtitle")}</Text>
</Stack>

// Horizontal layout — side-by-side content
<Row gap="group" align="center" justify="between">
  <Text variant="heading-sm">{t("label")}</Text>
  <Button variant="outline" size="sm">{t("action")}</Button>
</Row>

// Responsive: stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-section items-start">
  <aside className="w-full md:w-64">{/* Sidebar */}</aside>
  <main className="flex-1">{/* Main */}</main>
</div>
```

**Semantic gap scale** (use these, never arbitrary values):
| Token | CSS | Pixels | Use |
|-------|-----|--------|-----|
| `element` | gap-element | 8px | Inline elements, icon + label |
| `group` | gap-group | 16px | Related items within a group |
| `section` | gap-section | 32px | Distinct content sections |
| `page` | gap-page | 48px | Top-level page divisions |

Numeric gaps (`xs`=2px, `sm`=4px, `md`=8px, `lg`=12px, `xl`=16px, `2xl`=24px) for fine-tuning.

## Step 3: Build Grids

```tsx
// Standard product grid — viewport responsive
<Grid cols={4} gap="default">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</Grid>
// Renders: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6

// Container-query grid — responds to parent width, not viewport
<ResponsiveContainer name="grid">
  <Grid cols={3} gap="default" containerQuery>
    {items.map(i => <Card key={i.id}>{i.name}</Card>)}
  </Grid>
</ResponsiveContainer>
// Renders: grid-cols-1 cq-sm:grid-cols-2 cq-xl:grid-cols-3
```

**Column presets** (viewport):
| cols | Breakpoints |
|------|-------------|
| `1` | Always 1 column |
| `2` | 1 → md:2 |
| `3` | 1 → md:2 → lg:3 |
| `4` | 1 → sm:2 → lg:4 |
| `"2-3"` | 2 → lg:3 |
| `"masonry"` | 2 → md:3 → lg:4 |

- Use `containerQuery` prop when grid lives inside a resizable panel (sidebar, card, modal)
- Grid children don't need explicit col-span — auto-fill by default
- For asymmetric layouts, use raw `grid` + `col-span-*`:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-section">
  <div className="md:col-span-2">{/* 2/3 width */}</div>
  <aside>{/* 1/3 width */}</aside>
</div>
```

## Step 4: Manage Z-Index Layers

```tsx
// Header — sticky with z-50
<header className="sticky top-0 z-50 w-full">

// Modal overlay — z-40 backdrop + z-50 content
<div className="fixed inset-0 z-40 bg-black/50" />
<div className="fixed inset-0 z-50 flex items-center justify-center">
```

| z-value | Use | Example |
|---------|-----|---------|
| `z-10` | Dropdown menus | Select popover |
| `z-20` | Sticky elements | Table header |
| `z-30` | Fixed elements | FAB button |
| `z-40` | Modal backdrop | Overlay dim |
| `z-50` | Modal / header | Dialog, sticky nav |
| `z-60` | Popover | Context menu |
| `z-70` | Tooltip | Hover hint |
| `z-80` | Toast | Notification |

Never use arbitrary z-index (`z-[999]`). If the scale doesn't fit, the stacking context is wrong.

## Step 5: Responsive Patterns

```tsx
// Show/hide at breakpoints
<nav className="hidden md:flex gap-group">{/* Desktop nav */}</nav>
<Button className="md:hidden" variant="ghost">{/* Mobile menu */}</Button>

// Responsive typography
<Text variant="heading-lg" className="text-2xl md:text-3xl lg:text-4xl">

// Responsive spacing — Section/Container handle this automatically
<Section spacing="default">  {/* py-16 md:py-24 */}
  <Container size="2xl">     {/* px-4 sm:px-6 lg:px-8 */}
```

**Mobile-first rule**: Base class = mobile. Add `sm:` / `md:` / `lg:` / `xl:` for larger screens.

| Breakpoint | Width | Target |
|------------|-------|--------|
| (base) | 0+ | Mobile portrait |
| `sm:` | 640px | Mobile landscape |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

**Container queries** (`cq-*`) for component-level responsiveness — use when the component doesn't know its viewport context (reusable cards, sidebar widgets).

## Full Page Template

```tsx
<Section spacing="large" background="muted">
  <Container size="lg">
    <Stack gap="section" align="center" className="text-center">
      <Text variant="display-md">{t("hero.title")}</Text>
      <Text variant="body-lg">{t("hero.subtitle")}</Text>
      <Row gap="group" justify="center">
        <Button>{t("hero.cta")}</Button>
        <Button variant="outline">{t("hero.secondary")}</Button>
      </Row>
    </Stack>
  </Container>
</Section>

<Section spacing="default">
  <Container size="2xl">
    <Stack gap="section">
      <Text variant="heading-lg">{t("products.title")}</Text>
      <Grid cols={4} gap="default">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </Grid>
    </Stack>
  </Container>
</Section>
```

## Quick Checklist

- [ ] Every band: `<Section>` (spacing + background) → `<Container>` (one per section, never nested)
- [ ] Direction: `<Stack>` vertical, `<Row>` horizontal — gaps use semantic tokens only
- [ ] Multi-column: `<Grid cols={N}>` for symmetric, raw `grid` + `col-span-*` for asymmetric
- [ ] Container queries: `<ResponsiveContainer>` + `containerQuery` prop for reusable components
- [ ] Z-index: 10-80 scale only — no arbitrary values (`z-[999]`)
- [ ] Responsive: mobile-first, `sm:` → `md:` → `lg:` → `xl:` overrides
- [ ] No inline styles, no `gap-[24px]`, no raw `div` for layout — `data-slot` on all components
- [ ] Tested at 375px, 768px, 1024px, 1280px viewports
