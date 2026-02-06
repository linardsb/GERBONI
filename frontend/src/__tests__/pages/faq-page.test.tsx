import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FAQPage from "@/app/[locale]/faq/page";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => {
    const t = (key: string) => `translated:${key}`;
    return t;
  }),
}));

// Mock Link component from i18n routing
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock all icon components
vi.mock("@/components/icons", () => ({
  IconPackage: () => <div data-testid="icon-package" />,
  IconTruck: () => <div data-testid="icon-truck" />,
  IconRefresh: () => <div data-testid="icon-refresh" />,
  IconCreditCard: () => <div data-testid="icon-creditcard" />,
  IconShirt: () => <div data-testid="icon-shirt" />,
  IconHelp: () => <div data-testid="icon-help" />,
  IconChevronDown: () => <div data-testid="icon-chevron-down" />,
}));

describe("FAQPage - BUG-001 Regression: i18n translations", () => {
  it("uses translation keys instead of hard-coded English strings", () => {
    render(<FAQPage />);

    // Assert that translated keys are present (not hard-coded English)
    expect(screen.getByText("translated:title")).toBeInTheDocument();
    expect(screen.getByText("translated:subtitle")).toBeInTheDocument();
    expect(screen.getByText("translated:description")).toBeInTheDocument();
    expect(screen.getByText("translated:stillHaveQuestions")).toBeInTheDocument();
    expect(screen.getByText("translated:stillHaveQuestionsDescription")).toBeInTheDocument();
    expect(screen.getByText("translated:contactSupport")).toBeInTheDocument();
    expect(screen.getByText("translated:emailUs")).toBeInTheDocument();
  });

  it("uses translated category titles and question/answer pairs", () => {
    render(<FAQPage />);

    // Check category title translations are used
    expect(screen.getByText("translated:ordersShipping.title")).toBeInTheDocument();
    expect(screen.getByText("translated:returnsRefunds.title")).toBeInTheDocument();
    expect(screen.getByText("translated:productsSizing.title")).toBeInTheDocument();
    expect(screen.getByText("translated:paymentSecurity.title")).toBeInTheDocument();
    expect(screen.getByText("translated:accountSupport.title")).toBeInTheDocument();
    expect(screen.getByText("translated:bulkCustom.title")).toBeInTheDocument();
  });

  it("does not contain hard-coded English FAQ strings", () => {
    const { container } = render(<FAQPage />);
    const text = container.textContent || "";

    // Verify no hard-coded English strings are present
    expect(text).not.toContain("What payment methods");
    expect(text).not.toContain("How long does shipping");
    expect(text).not.toContain("Can I return");
    expect(text).not.toContain("What sizes are available");
    expect(text).not.toContain("Still have questions?");
  });

  it("uses translation keys for all FAQ questions", () => {
    render(<FAQPage />);

    // Sample question from each category (answers are hidden in collapsed accordion)
    expect(screen.getByText("translated:ordersShipping.q1")).toBeInTheDocument();
    expect(screen.getByText("translated:returnsRefunds.q1")).toBeInTheDocument();
    expect(screen.getByText("translated:productsSizing.q1")).toBeInTheDocument();
    expect(screen.getByText("translated:paymentSecurity.q1")).toBeInTheDocument();
    expect(screen.getByText("translated:accountSupport.q1")).toBeInTheDocument();
    expect(screen.getByText("translated:bulkCustom.q1")).toBeInTheDocument();
  });
});
