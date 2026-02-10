# Theming Guide

The GERBONI frontend ships with a runtime theme system that swaps all visual tokens (colors, fonts, spacing, radius, effects) without touching any component code. Themes are developer/admin-only — customers see one design.

## Switching Themes (UI)

1. **Development**: A palette button appears automatically at bottom-left of every page
2. **Production**: Append `?theme-debug=true` to any URL to show the switcher
3. Click the palette icon, pick a theme — changes apply instantly across all pages
4. Your choice persists in `localStorage` across sessions and page refreshes

## Dark Mode Toggle

Click the sun/moon icon in the header (between the language switcher and wishlist icon). Dark mode works independently within each theme — every theme defines its own dark palette.

## Built-in Themes

| Theme | Primary Color | Style |
|-------|--------------|-------|
| **Gerboni** (default) | Red/cyan | Bold, angular, 3D buttons — the original brand identity |
| **Modern Minimal** | Slate blue | Clean, rounded, system fonts — contemporary e-commerce |
| **Classic Heritage** | Forest green | Warm, serif headings, wide spacing — museum-like aesthetic |

## Creating a New Theme

### Step 1: Copy an Existing Theme

```bash
cp frontend/src/lib/themes/modern-minimal.ts frontend/src/lib/themes/my-theme.ts
```

### Step 2: Edit Your Theme File

Update `id`, `name`, `description`, `previewColors`, and fill in your design values:

```ts
import type { GerboniTheme } from "./types"

export const myTheme: GerboniTheme = {
  id: "my-theme",
  name: "My Theme",
  description: "A custom look for GERBONI",

  previewColors: {
    primary: "oklch(0.55 0.20 280)",
    background: "oklch(0.98 0.01 240)",
    foreground: "oklch(0.20 0.02 240)",
    accent: "oklch(0.94 0.01 240)",
  },

  colors: {
    background: "oklch(0.98 0.01 240)",
    foreground: "oklch(0.20 0.02 240)",
    primary: "oklch(0.55 0.20 280)",
    primaryForeground: "oklch(0.98 0 0)",
    secondary: "oklch(0.94 0.01 240)",
    secondaryForeground: "oklch(0.30 0.02 240)",
    accent: "oklch(0.94 0.01 240)",
    accentForeground: "oklch(0.30 0.02 240)",
    muted: "oklch(0.94 0.01 240)",
    mutedForeground: "oklch(0.55 0.02 240)",
    destructive: "oklch(0.55 0.20 25)",
    border: "oklch(0.88 0.01 240)",
    input: "oklch(0.88 0.01 240)",
    ring: "oklch(0.55 0.20 280)",
    // ... all ~45 tokens (see gerboni-default.ts for complete list)
  },

  darkColors: {
    background: "oklch(0.15 0.02 240)",
    foreground: "oklch(0.95 0.01 240)",
    // ... partial overrides for dark mode
  },

  typography: {
    fontSans: "Inter, system-ui, sans-serif",
    fontHeading: "Inter, system-ui, sans-serif",
    fontSerif: "Georgia, serif",
    fontMono: "monospace",
    fontLatvian: "Inter, system-ui, sans-serif",
    letterSpacingHeading: "0",
    letterSpacingWide: "0.1em",
  },

  spacing: {
    page: "3rem",
    section: "2.5rem",
    group: "1.5rem",
    element: "0.75rem",
  },

  radius: {
    base: "0.5rem",
    card: "0.75rem",
  },

  effects: {
    enable3DButton: false,
    enableHoverUnderline: true,
    enableHoverScale: true,
  },

  fonts: [],
  animations: {},
}
```

### Step 3: Register the Theme

Add your theme to `frontend/src/lib/themes/index.ts`:

```ts
import { myTheme } from "./my-theme"

export const themes: GerboniTheme[] = [
  gerboniDefault,
  modernMinimal,
  classicHeritage,
  myTheme,  // add here
]
```

### Step 4: Preview

Start the dev server (`npm run dev`) and your theme immediately appears in the theme switcher panel.

## Extracting Colors from Figma

1. Open your Figma design file
2. Select a color swatch and copy the hex or RGB value
3. Convert to OKLch format at [oklch.com](https://oklch.com) or using browser DevTools
4. Paste the `oklch(L C H)` value into your theme's `colors` object
5. Repeat for all ~45 color tokens

**Tip**: Start with `gerboni-default.ts` as your template — it has every token documented.

## Custom Fonts

Themes can load custom fonts dynamically:

1. Add `.woff2` font files to `public/fonts/themes/{theme-id}/`
2. Define them in the `fonts` array:

```ts
fonts: [
  {
    family: "Custom Heading",
    src: "/fonts/themes/my-theme/custom-heading.woff2",
    weight: "700",
    style: "normal",
    display: "swap",
  },
],
```

3. Reference the family in `typography.fontHeading`:

```ts
typography: {
  fontHeading: "'Custom Heading', sans-serif",
  // ...
},
```

Fonts are loaded via the `FontFace` API on theme activation. There may be a brief FOUT (flash of unstyled text) on first switch — acceptable since theme switching is an admin action.

**Note**: The default Gerboni theme fonts (Figtree, Capsuula, Forum, Liva) are always loaded statically via `next/font` for optimal performance.

## What Themes Control

| Controls | Does NOT Control |
|----------|-----------------|
| All 45 color tokens | Component structure or layout |
| Font families and tracking | Route paths or navigation |
| Spacing (page/section/group/element) | Business logic or API behavior |
| Border radius (base + card) | Content or translations |
| 3D button effect toggle | Image assets |
| Hover underline effect toggle | Grid column counts or breakpoints |
| Hover scale effect toggle | Container query breakpoints |
| Dark mode color palette | Z-index layering |

## Layout System

The layout system is theme-independent — it uses semantic layout components, not raw divs. Full reference: `reference/frontend_layout_guide.md`.

### Component Hierarchy

```
Section          ← Full-width band (background + vertical spacing)
  Container      ← Centered max-width wrapper (horizontal padding)
    Stack/Row    ← Flex direction (vertical/horizontal)
      Grid       ← Multi-column responsive grid
        Card     ← Content container (padding + border)
```

### Section + Container (Page Structure)

Every page section wraps content in `Section` → `Container`:

```tsx
<Section spacing="default" background="muted">
  <Container size="2xl">
    {/* Content here — max-w-7xl, responsive px-4 sm:px-6 lg:px-8 */}
  </Container>
</Section>
```

**Section spacing**: `none` (py-0) | `compact` (py-8 md:py-12) | `default` (py-16 md:py-24) | `large` (py-24 md:py-32)

**Section background**: `default` | `muted` | `dark` | `accent`

**Container size**: `sm` (max-w-2xl) | `md` (4xl) | `lg` (5xl) | `xl` (6xl) | `2xl` (7xl, default) | `3xl` (90rem) | `full` (100%)

Rules: Never nest Containers. One Container per Section.

### Stack and Row (Direction)

```tsx
// Vertical — stacked content
<Stack gap="section" align="center">
  <Text variant="heading-lg">{t("title")}</Text>
  <Text variant="body-md">{t("subtitle")}</Text>
</Stack>

// Horizontal — side-by-side
<Row gap="group" align="center" justify="between">
  <Text variant="heading-sm">{t("label")}</Text>
  <Button variant="outline" size="sm">{t("action")}</Button>
</Row>
```

**Semantic gaps** (use these, never arbitrary values like `gap-[24px]`):

| Token | Pixels | Use |
|-------|--------|-----|
| `element` | 8px | Inline elements, icon + label |
| `group` | 16px | Related items within a group |
| `section` | 32px | Distinct content sections |
| `page` | 48px | Top-level page divisions |

Numeric gaps (`xs`=2px, `sm`=4px, `md`=8px, `lg`=12px, `xl`=16px, `2xl`=24px) for fine-tuning.

### Grid (Multi-Column Layouts)

```tsx
// Viewport responsive — standard product grid
<Grid cols={4} gap="default">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</Grid>

// Container-query responsive — component-level
<ResponsiveContainer name="grid">
  <Grid cols={3} gap="default" containerQuery>
    {items.map(i => <Card key={i.id}>{i.name}</Card>)}
  </Grid>
</ResponsiveContainer>

// Asymmetric — raw grid with col-span
<div className="grid grid-cols-1 md:grid-cols-3 gap-section">
  <div className="md:col-span-2">{/* 2/3 width */}</div>
  <aside>{/* 1/3 width */}</aside>
</div>
```

**Column presets** (the Grid component handles responsive breakpoints automatically):

| cols | Result |
|------|--------|
| `1` | Always 1 column |
| `2` | 1 → md:2 |
| `3` | 1 → md:2 → lg:3 |
| `4` | 1 → sm:2 → lg:4 |
| `"2-3"` | 2 → lg:3 |
| `"masonry"` | 2 → md:3 → lg:4 |

### Z-Index Scale

| z-value | Use |
|---------|-----|
| `z-10` | Dropdown menus |
| `z-20` | Sticky elements |
| `z-30` | Fixed elements |
| `z-40` | Modal backdrop |
| `z-50` | Modal / header |
| `z-60` | Popover |
| `z-70` | Tooltip |
| `z-80` | Toast |

Never use arbitrary z-index (`z-[999]`).

### Responsive Breakpoints

| Prefix | Width | Target |
|--------|-------|--------|
| (base) | 0+ | Mobile portrait |
| `sm:` | 640px | Mobile landscape |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

**Mobile-first**: Base class = mobile. Layer up with `sm:` → `md:` → `lg:` → `xl:`.

**Container queries** (`cq-*`): Use when a component doesn't know its viewport context (sidebar widgets, reusable cards). Wrap parent in `<ResponsiveContainer>` and pass `containerQuery` prop to `<Grid>`.

### Full Page Example

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

## Changing Layouts at the Component Level

Themes control spacing *values* (how many pixels `gap-section` equals). To change the actual *structure* — column counts, content width, section density, sidebar placement — you modify the page or component code directly.

### Change Product Grid Columns

```tsx
// Before: 4-column grid
<Grid cols={4} gap="default">

// After: 3-column grid (fewer, larger cards)
<Grid cols={3} gap="default">

// After: masonry layout (2 → 3 → 4 columns as viewport grows)
<Grid cols="masonry" gap="default">
```

Available presets: `1`, `2`, `3`, `4`, `"2-3"`, `"masonry"`. See column preset table in the Layout System section above.

### Change Content Width

```tsx
// Before: wide layout (max-w-7xl = 1280px)
<Container size="2xl">

// After: narrow, focused reading layout (max-w-4xl = 896px)
<Container size="md">

// After: full edge-to-edge (1.5% horizontal padding only)
<Container size="full">
```

Sizes: `sm` (672px) → `md` (896px) → `lg` (1024px) → `xl` (1152px) → `2xl` (1280px) → `3xl` (1440px) → `full` (100%).

### Change Section Density

```tsx
// Before: standard spacing (py-16 md:py-24)
<Section spacing="default">

// After: compact — tighter vertical rhythm
<Section spacing="compact">  {/* py-8 md:py-12 */}

// After: large — dramatic hero spacing
<Section spacing="large">  {/* py-24 md:py-32 */}

// After: flush — no vertical padding
<Section spacing="none">
```

### Change Section Background

```tsx
// Alternating sections for visual rhythm
<Section spacing="default" background="default">  {/* White/dark base */}
  <Container size="2xl">{/* Content */}</Container>
</Section>

<Section spacing="default" background="muted">    {/* Subtle grey tint */}
  <Container size="2xl">{/* Content */}</Container>
</Section>

<Section spacing="default" background="dark">     {/* Dark with light text */}
  <Container size="2xl">{/* Content */}</Container>
</Section>

<Section spacing="default" background="accent">   {/* Brand-tinted */}
  <Container size="2xl">{/* Content */}</Container>
</Section>
```

### Add a Sidebar Layout

```tsx
// Two-column: sidebar + main content
<Section spacing="default">
  <Container size="2xl">
    <div className="flex flex-col md:flex-row gap-section items-start">
      <aside className="w-full md:w-64 shrink-0">
        <Card>
          <Stack gap="group">{/* Sidebar nav / filters */}</Stack>
        </Card>
      </aside>
      <main className="flex-1 min-w-0">
        <Stack gap="section">{/* Main content */}</Stack>
      </main>
    </div>
  </Container>
</Section>
```

### Asymmetric Grid (2/3 + 1/3 Split)

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-section">
  <div className="md:col-span-2">
    {/* Wide column: product details, article body */}
  </div>
  <aside>
    {/* Narrow column: related products, table of contents */}
  </aside>
</div>
```

### Change Internal Spacing (Gap Tokens)

```tsx
// Tight: icon + label pairs, badges
<Row gap="element">{/* 8px gap */}</Row>

// Normal: form fields, list items
<Stack gap="group">{/* 16px gap */}</Stack>

// Wide: distinct content blocks
<Stack gap="section">{/* 32px gap */}</Stack>

// Widest: top-level page divisions
<Stack gap="page">{/* 48px gap */}</Stack>

// Fine-tuning with numeric gaps
<Row gap="xs">{/* 2px */}</Row>
<Row gap="sm">{/* 4px */}</Row>
<Row gap="lg">{/* 12px */}</Row>
<Row gap="xl">{/* 16px */}</Row>
<Row gap="2xl">{/* 24px */}</Row>
```

### Responsive Show/Hide

```tsx
// Desktop-only navigation
<nav className="hidden md:flex gap-group">{/* Desktop nav */}</nav>

// Mobile-only hamburger
<Button className="md:hidden" variant="ghost" size="icon">
  <IconMenu2 className="size-5" />
</Button>

// Show on tablet and up
<aside className="hidden sm:block">{/* Tablet+ sidebar */}</aside>

// Different layout per breakpoint
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-group">
  {/* 1 col mobile → 2 col tablet → 4 col desktop */}
</div>
```

### Container-Query Grid (Reusable Components)

When a component may live in different-width parents (sidebar vs main content vs modal), use container queries instead of viewport breakpoints:

```tsx
// Parent declares itself as a container query context
<ResponsiveContainer name="grid">
  {/* Grid responds to parent width, not viewport width */}
  <Grid cols={3} gap="default" containerQuery>
    {items.map(i => <Card key={i.id}>{i.name}</Card>)}
  </Grid>
</ResponsiveContainer>
```

This renders `cq-sm:grid-cols-2 cq-xl:grid-cols-3` — the grid adapts to its container, not the window.

### Quick Reference: What to Change Where

| Want to change... | Modify... |
|-------------------|-----------|
| Number of grid columns | `<Grid cols={N}>` prop |
| Content max-width | `<Container size="...">` prop |
| Vertical section rhythm | `<Section spacing="...">` prop |
| Section backgrounds | `<Section background="...">` prop |
| Space between items | `gap` prop on Stack/Row/Grid |
| Sidebar presence | Add flex layout in page component |
| Column width ratios | Raw `grid` + `col-span-*` classes |
| Mobile/desktop visibility | `hidden md:flex` / `md:hidden` classes |
| Component-level responsiveness | `<ResponsiveContainer>` + `containerQuery` prop |
| Spacing *values* globally | Theme `spacing` object (affects all semantic tokens) |

## How It Works (Technical)

1. **SSR**: `globals.css` `:root` values render the default theme — zero FOUC
2. **Anti-FOUC script**: Synchronous `<script>` in `<head>` reads `localStorage`, sets `data-theme` attribute before paint
3. **React hydration**: `GerboniThemeProvider` mounts, reads localStorage, calls `applyThemeToDOM()`
4. **CSS injection**: All `--background`, `--primary`, etc. set on `<html>` via `style.setProperty()`
5. **Dark mode**: `next-themes` manages `.dark` class, theme-specific dark overrides injected via `<style>` tag
6. **Components**: Use CSS variables (`bg-primary`, `text-foreground`) — they automatically resolve to the active theme

**Key files**:

| File | Purpose |
|------|---------|
| `src/lib/themes/types.ts` | `GerboniTheme` interface — the theme contract |
| `src/lib/themes/theme-utils.ts` | `applyThemeToDOM()`, `clearThemeFromDOM()`, `loadThemeFonts()` |
| `src/lib/themes/index.ts` | Theme registry and `getThemeById()` |
| `src/lib/themes/gerboni-default.ts` | Default theme (source of truth, matches `globals.css`) |
| `src/components/providers/theme-provider.tsx` | React context, `useGerboniTheme()` hook |
| `src/components/compositions/theme-switcher.tsx` | Floating dev-only UI panel |
