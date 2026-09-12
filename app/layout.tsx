import type { Metadata } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import './globals.css'

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
    <html lang="en" className="scroll-smooth" style={{ fontFamily: nunito.style.fontFamily }}>
      <body className="font-sans antialiased bg-gradient-to-br from-amber-50 via-white to-orange-50">
        {children}
      </body>
    </html>
  )
}
