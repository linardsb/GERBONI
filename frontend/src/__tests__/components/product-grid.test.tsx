import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductGrid } from '@/components/compositions/product-grid'

// ProductGrid transitively imports ProductCard, which relies on next-intl, the
// i18n routing Link and next/image. Mock them so the module graph loads cleanly
// (mirrors product-card.test.tsx).
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}))
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

describe('ProductGrid empty state (BUG-011 regression)', () => {
  it('does not render a hardcoded English fallback when emptyMessage is omitted', () => {
    // Regression for BUG-011: emptyMessage previously defaulted to
    // "No products available.", leaking English text regardless of locale.
    // The default has been removed, so no English string must appear.
    const { container } = render(<ProductGrid products={[]} />)
    expect(container.textContent).not.toContain('No products available')
  })

  it('renders the caller-supplied (translated) empty message', () => {
    render(<ProductGrid products={[]} emptyMessage="Nav pieejamu produktu." />)
    expect(screen.getByText('Nav pieejamu produktu.')).toBeInTheDocument()
  })
})
