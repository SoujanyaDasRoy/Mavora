import type { Metadata } from "next";
import { Inter, Space_Grotesk, Fraunces, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Body — Inter (clean, highly legible, editorial-friendly)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Headlines — Space Grotesk (geometric, minimal, modern tech vibe)
// Tight letter-spacing, strong weight contrast, deeply professional.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Dateline/eyebrow face — "Vol./Issue" masthead labels and mono metadata
// rows read like wire-service data, not another display font competing
// for attention.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

// Article headings only — Fraunces is a soft, high-contrast serif with
// genuinely curved terminals (its defining trait vs. a standard book
// serif), used to give long-form article titles a distinct editorial
// feel against the geometric Space Grotesk used for nav/card chrome.
const fraunces = Fraunces({
  variable: "--font-article",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const DESCRIPTION =
  "Help ambitious students, professionals, creators and founders understand technology, AI, productivity and business in a practical, actionable way.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mavora",
    template: "%s | Mavora",
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: "Mavora",
    title: "Mavora",
    description: DESCRIPTION,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mavora",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var stored = localStorage.getItem('theme');
                var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
