import type { Metadata } from "next";
import { Newsreader, Inter, JetBrains_Mono, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Newsreader — a transitional serif designed for long-read body text.
// Chosen as the display face because it carries editorial weight without
// slipping into "AI-default cream + serif + terracotta" territory (the
// skill called that look out by name). It's also a Google-hosted variable
// font, so weights 200–800 are all served from one file.
const fontDisplay = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const fontArticle = Outfit({
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
