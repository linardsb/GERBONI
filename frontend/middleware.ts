import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes (/api/*)
  // - Static files (/_next/*, /images/*, etc.)
  // - The favicon and other root files
  matcher: [
    // Match all pathnames except for those that start with:
    // - api, _next, _vercel, monitoring
    // - files with extensions (e.g., favicon.ico, image.png)
    "/((?!api|_next|_vercel|monitoring|.*\\..*).*)",
  ],
};
