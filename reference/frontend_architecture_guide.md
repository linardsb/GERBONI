# Frontend Architecture Guide

Use when adding a new feature, page, or module to the GERBONI frontend.

## Architecture

```
Import only downward — never up:

  app/[locale]/*/page.tsx    ← Routes (server/client split)
       ↓
  compositions/              ← Organisms (domain assemblies)
       ↓
  components/                ← Molecules (reusable domain widgets)
       ↓
  elements/                  ← Atoms (design system primitives)
       ↓
  lib/                       ← Shared (api.ts, store.ts, utils.ts)
```

## Step 1: Create the Route

```tsx
// app/[locale]/feature/page.tsx — SERVER (no "use client")
import { getTranslations } from "next-intl/server"
import { FeatureClient } from "./feature-client"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "feature" })
  return { title: t("pageTitle"), description: t("pageDescription") }
}

export default async function FeaturePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resource?lang=${locale}`, {
    next: { revalidate: 300 },
  }).then((r) => r.json())
  return <FeatureClient initialData={data} />
}
```

```tsx
// app/[locale]/feature/feature-client.tsx — CLIENT
"use client"
import { useTranslations } from "next-intl"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"

export function FeatureClient({ initialData }: { initialData: Resource[] }) {
  const t = useTranslations("feature")
  return (
    <Stack gap="page" data-slot="feature-page">
      <Text as="h1" variant="heading-xl">{t("title")}</Text>
    </Stack>
  )
}
```

- Every data-fetching route gets its own `error.tsx` (copy from `app/error.tsx`)
- `useSearchParams()` MUST be wrapped in `<Suspense>` or build fails
- Static pages (about, faq) — single server component, no split needed

## Step 2: Build Components Bottom-Up

```tsx
// elements/status-badge.tsx — ATOM (design system primitive)
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", {
  variants: {
    status: {
      active: "bg-success/10 text-success",
      inactive: "bg-muted text-muted-foreground",
      error: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: { status: "active" },
})

export function StatusBadge({
  className, status, ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>) {
  return <span data-slot="status-badge"
    className={cn(statusBadgeVariants({ status, className }))} {...props} />
}
```

```tsx
// compositions/feature-card.tsx — ORGANISM (domain assembly)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card"
import { StatusBadge } from "@/components/elements/status-badge"
import { Button } from "@/components/elements/button"
import { useTranslations } from "next-intl"

export function FeatureCard({ item, onAction }: { item: Resource; onAction: (id: number) => void }) {
  const t = useTranslations("feature")
  return (
    <Card data-slot="feature-card">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <StatusBadge status={item.is_active ? "active" : "inactive"} />
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => onAction(item.id)}>{t("viewDetails")}</Button>
      </CardContent>
    </Card>)
}
```

- Every component root: `data-slot="name"`. All `className` via `cn()`.
- CVA for 2+ visual variants. Icons from Tabler at `size-4`/`size-5`.

## Step 3: Add State Management

`useState` → single component | `Zustand` → shared across routes | `Zustand+persist` → survives reload | Server fetch → read-only data

```tsx
// lib/store.ts — add new store (one per domain, flat shape)
interface FeatureState {
  items: Resource[]
  isLoading: boolean
  setItems: (items: Resource[]) => void
  setLoading: (loading: boolean) => void
}

export const useFeatureStore = create<FeatureState>((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),
}))
// Wrap with persist() only if state must survive page reload
```

- Flat stores — derive values in components. No API calls inside stores.

## Step 4: Wire Up API Layer

```tsx
// lib/api.ts — types must mirror backend Pydantic schemas
export interface Resource { id: number; name: string; is_active: boolean; created_at: string }

export const getResources = (token?: string | null, guestSession?: string | null) =>
  fetchApi<Resource[]>("/resources", { token, guestSession })

export const createResource = (data: ResourceCreate, token: string) =>
  fetchApi<Resource>("/resources", { method: "POST", token, body: JSON.stringify(data) })

// Usage: dual auth + translated errors
const { token, guestSession } = useAuthStore()
useEffect(() => {
  getResources(token, guestSession?.session_token)
    .then(setItems)
    .catch((err) => {
      if (err instanceof ApiError && err.status === 401) toast.error(t("authRequired"))
      else toast.error(t("loadError"))
    })
}, [token, guestSession])
```

- All user-scoped endpoints pass both `token` AND `guestSession`
- Error messages always use `t("key")` — never hardcoded strings

## Step 5: Add Translations

Both files, same keys, always together.

```json
// en.json                              // lv.json
{ "feature": {                          { "feature": {
    "title": "Features",                    "title": "Iespējas",
    "viewDetails": "View Details",          "viewDetails": "Skatīt detaļas",
    "loadError": "Failed to load",          "loadError": "Neizdevās ielādēt",
    "itemCount": "{count, plural,           "itemCount": "{count, plural,
      one {# item} other {# items}}"          one {# vienums} other {# vienumi}}"
} }                                     } }
```

- ICU format for plurals: `t("itemCount", { count: 5 })`
- Dynamic API data (city names) stays as `locale === "lv"` ternary

## Quick Checklist

- [ ] Route: server/client split (`page.tsx` + `feature-client.tsx`)
- [ ] `generateMetadata()` with translated title + description
- [ ] `error.tsx` for routes with data fetching
- [ ] `useSearchParams()` wrapped in `<Suspense>` if used
- [ ] Components follow: elements → components → compositions (no upward imports)
- [ ] Every component has `data-slot="name"`
- [ ] CVA for visual variants, `cn()` for all className merging
- [ ] Spacing tokens only: `gap-element` / `gap-group` / `gap-section` / `gap-page`
- [ ] Color tokens only: `bg-primary`, `text-foreground` — no hex/rgb/arbitrary
- [ ] State: `useState` for local, Zustand for cross-route sharing
- [ ] API types mirror backend Pydantic schemas exactly
- [ ] Dual auth: pass both `token` + `guestSession` on user-scoped calls
- [ ] Translations in both `en.json` AND `lv.json` with matching keys
- [ ] All user-facing text via `useTranslations()` — no hardcoded strings
- [ ] No inline styles, no `gap-[24px]`, no hardcoded colors
