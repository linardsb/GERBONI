import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import RootPage from "@/app/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("RootPage - BUG-003 Regression: root path redirect", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    vi.clearAllMocks();
  });

  it("redirects to /en when root page is accessed", () => {
    // redirect() throws in the actual implementation to stop execution
    // We need to handle that in tests
    try {
      RootPage();
    } catch {
      // Expected - redirect throws to stop execution
    }

    // Verify redirect was called with /en
    expect(redirect).toHaveBeenCalledWith("/en");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("does not render any content (only redirects)", () => {
    try {
      const result = RootPage();
      // If redirect didn't throw (in test env), result should be undefined/null
      expect(result).toBeUndefined();
    } catch {
      // Expected behavior in actual implementation
    }

    // Verify redirect was called
    expect(redirect).toHaveBeenCalledWith("/en");
  });

  it("redirects to English locale by default (not Latvian)", () => {
    try {
      RootPage();
    } catch {
      // Expected
    }

    // Ensure it's /en, not /lv
    expect(redirect).toHaveBeenCalledWith("/en");
    expect(redirect).not.toHaveBeenCalledWith("/lv");
  });
});
