import type { Metadata } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ThemeToggle from '@/components/theme-toggle'

const nunito = Nunito({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Without this, per-animal pages emit a relative og:url and relative image
  // URLs, which link previews and QR scanners cannot resolve. Vercel supplies
  // VERCEL_URL per deployment; the production domain is the fallback.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://pawbookiitb.vercel.app'),
  ),
  title: 'PawBook IITB — Instagram for Campus Animals',
  description: 'A digital memory book for the beloved animals of IIT Bombay. Share photos, memories, and care for campus animals together. Every animal has a story. 🐾',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: next-themes sets the class on <html> before
    // React hydrates, which is the point — it prevents a flash of the wrong
    // theme — but it means the server and client markup differ here by design.
    <html lang="en" className="scroll-smooth" suppressHydrationWarning style={{ fontFamily: nunito.style.fontFamily }}>
      {/*
        The background was hardcoded to a light amber gradient, which overrode
        every dark token beneath it. That is why the .dark block in globals.css
        could never show: the provider was not mounted, and even mounted it had
        nothing to repaint.
      */}
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
