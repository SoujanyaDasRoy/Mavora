import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Geist — Vercel's modern geometric sans, used as the display face for
// the Stripe/Vercel aesthetic. Tight tracking, even strokes, high
// legibility at small sizes (sidebar labels, table headers).
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontDisplay = Geist({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const fontArticle = Inter({
  subsets: ["latin"],
  variable: "--font-article",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mavora CMS",
  description: "Editorial workspace for Mavora",
};

// Three-way theme: light / dark / dark-oled. The `dark-oled` value adds
// both `dark` and `oled` so every existing `:root.dark` rule in globals.css
// still applies, and the more specific `.dark.oled` overrides win. Mirrors
// the class toggling in components/theme-provider.tsx.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem("cms-theme");
    if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (t === "dark" || t === "dark-oled") document.documentElement.classList.add("dark");
    if (t === "dark-oled") document.documentElement.classList.add("oled");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} ${fontArticle.variable}`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
