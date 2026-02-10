import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Figtree, Geist_Mono, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const liva = localFont({
  src: "../../public/fonts/Liva.ttf",
  variable: "--font-liva",
  display: "swap",
});

const gputeks = localFont({
  src: "../../public/fonts/Gputeks-Regular.ttf",
  variable: "--font-gputeks",
  display: "swap",
});

const benne = localFont({
  src: "../../public/fonts/Benne-Regular-COPY.woff2",
  variable: "--font-benne",
  display: "swap",
});

const forum = localFont({
  src: "../../public/fonts/Forum-COPY.woff2",
  variable: "--font-forum",
  display: "swap",
});

const capsuula = localFont({
  src: "../../public/fonts/Capsuula-TITLE.woff2",
  variable: "--font-capsuula",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GERBONI - Latvian City Coat of Arms T-Shirts",
  description:
    "Premium t-shirts featuring authentic coats of arms from Latvian cities. Wear your heritage with pride.",
};

/**
 * Anti-FOUC script — runs synchronously before paint.
 * Reads the persisted theme ID from localStorage and sets
 * data-theme on <html> so the ThemeProvider can hydrate
 * with the correct theme already visible.
 */
const antiFoucScript = `
(function(){
  try {
    var t = localStorage.getItem('gerboni-theme');
    if (t && t !== 'gerboni-default') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
      </head>
      <body
        className={`${capsuula.variable} ${gputeks.variable} ${benne.variable} ${forum.variable} ${figtree.variable} ${geistMono.variable} ${playfairDisplay.variable} ${liva.variable} font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
