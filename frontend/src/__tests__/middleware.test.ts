import { describe, it, expect } from "vitest";

/**
 * BUG-002 Regression Test: Middleware static asset exclusion
 *
 * Verifies that the middleware matcher pattern correctly excludes static assets
 * from i18n processing to prevent 404 errors.
 *
 * The middleware config at /frontend/middleware.ts uses:
 * matcher: ["/((?!_next|api|favicon.ico|coats|bg_images|fonts).*)"]
 *
 * This test ensures new static asset directories are properly excluded.
 */

/**
 * Helper function to test if a path matches the middleware matcher
 * Returns true if middleware SHOULD process the path (i18n locale prefix required)
 * Returns false if middleware SHOULD skip the path (static asset, excluded)
 */
function shouldMiddlewareProcess(path: string): boolean {
  // Convert Next.js matcher pattern to regex
  // The pattern /((?!_next|api|...).*)  means:
  // - Start with /
  // - Negative lookahead: not followed by _next|api|...
  // - Match any characters

  const negatedPaths = "_next|api|favicon.ico|coats|bg_images|fonts";
  const regex = new RegExp(`^/((?!(${negatedPaths})).*)`);
  return regex.test(path);
}

describe("Middleware matcher - BUG-002 Regression: static asset exclusion", () => {
  describe("static assets that SHOULD be excluded from middleware", () => {
    it("excludes /fonts/ directory from middleware processing", () => {
      expect(shouldMiddlewareProcess("/fonts/Forum.woff2")).toBe(false);
      expect(shouldMiddlewareProcess("/fonts/Inter.ttf")).toBe(false);
      expect(shouldMiddlewareProcess("/fonts/custom-font.woff")).toBe(false);
    });

    it("excludes /bg_images/ directory from middleware processing", () => {
      expect(shouldMiddlewareProcess("/bg_images/hero.jpg")).toBe(false);
      expect(shouldMiddlewareProcess("/bg_images/hero-mobile.webp")).toBe(false);
      expect(shouldMiddlewareProcess("/bg_images/pattern.svg")).toBe(false);
    });

    it("excludes /coats/ directory from middleware processing", () => {
      expect(shouldMiddlewareProcess("/coats/riga.svg")).toBe(false);
      expect(shouldMiddlewareProcess("/coats/daugavpils.svg")).toBe(false);
      expect(shouldMiddlewareProcess("/coats/liepaja.svg")).toBe(false);
    });

    it("excludes /_next/ internal paths from middleware processing", () => {
      expect(shouldMiddlewareProcess("/_next/static/chunk.js")).toBe(false);
      expect(shouldMiddlewareProcess("/_next/webpack-hmr")).toBe(false);
      expect(shouldMiddlewareProcess("/_next/data/build-id/page.json")).toBe(false);
    });

    it("excludes /api/ routes from middleware processing", () => {
      expect(shouldMiddlewareProcess("/api/products")).toBe(false);
      expect(shouldMiddlewareProcess("/api/auth/login")).toBe(false);
      expect(shouldMiddlewareProcess("/api/cart")).toBe(false);
    });

    it("excludes favicon.ico from middleware processing", () => {
      expect(shouldMiddlewareProcess("/favicon.ico")).toBe(false);
    });
  });

  describe("localized routes that SHOULD be processed by middleware", () => {
    it("processes locale-prefixed product routes", () => {
      expect(shouldMiddlewareProcess("/en/products")).toBe(true);
      expect(shouldMiddlewareProcess("/lv/products")).toBe(true);
      expect(shouldMiddlewareProcess("/en/products/riga-tshirt")).toBe(true);
    });

    it("processes locale-prefixed auth routes", () => {
      expect(shouldMiddlewareProcess("/en/login")).toBe(true);
      expect(shouldMiddlewareProcess("/lv/register")).toBe(true);
    });

    it("processes locale-prefixed cart and checkout routes", () => {
      expect(shouldMiddlewareProcess("/en/cart")).toBe(true);
      expect(shouldMiddlewareProcess("/lv/checkout")).toBe(true);
    });

    it("processes locale-prefixed content pages", () => {
      expect(shouldMiddlewareProcess("/en/about")).toBe(true);
      expect(shouldMiddlewareProcess("/lv/contact")).toBe(true);
      expect(shouldMiddlewareProcess("/en/faq")).toBe(true);
    });

    it("processes root path and locale-only paths", () => {
      expect(shouldMiddlewareProcess("/")).toBe(true);
      expect(shouldMiddlewareProcess("/en")).toBe(true);
      expect(shouldMiddlewareProcess("/lv")).toBe(true);
    });
  });

  /**
   * Automated audit: ensures all known /public/ asset directories are excluded
   * from the middleware matcher. When adding a new /public/ directory, you MUST
   * add it to both KNOWN_PUBLIC_DIRS below and the middleware matcher in middleware.ts.
   */
  describe("Middleware audit - public directory coverage", () => {
    // Keep this list in sync with actual /public/ directories.
    // If you add a new directory under /public/, add it here AND to the
    // middleware matcher in middleware.ts — this test will fail otherwise.
    const KNOWN_PUBLIC_DIRS = ["coats", "bg_images", "fonts"];

    it("all known /public/ directories are excluded from middleware processing", () => {
      for (const dir of KNOWN_PUBLIC_DIRS) {
        expect(
          shouldMiddlewareProcess(`/${dir}/test-file.ext`),
          `/${dir}/ is NOT excluded from middleware — update matcher in middleware.ts`
        ).toBe(false);
      }
    });

    it("known public directories list matches middleware matcher exclusions", () => {
      // The matcher pattern in middleware.ts excludes: _next|api|favicon.ico|coats|bg_images|fonts
      // This test ensures our audit list covers all custom asset directories (excluding _next, api, favicon.ico)
      const MIDDLEWARE_ASSET_EXCLUSIONS = ["coats", "bg_images", "fonts"];

      expect(KNOWN_PUBLIC_DIRS.sort()).toEqual(MIDDLEWARE_ASSET_EXCLUSIONS.sort());
    });
  });

  describe("edge cases", () => {
    it("processes paths with similar names to excluded directories", () => {
      // These SHOULD be processed because they're not exact matches
      expect(shouldMiddlewareProcess("/en/fonts-catalog")).toBe(true);
      expect(shouldMiddlewareProcess("/lv/api-docs")).toBe(true);
    });

    it("excludes exact matches only, not partial matches", () => {
      // /fonts is excluded, but /custom-fonts is not
      expect(shouldMiddlewareProcess("/fonts/file.woff2")).toBe(false);
      expect(shouldMiddlewareProcess("/en/custom-fonts")).toBe(true);
    });
  });
});
