import type { Metadata } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import './globals.css'

const nunito = Nunito({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });

export const metadata: Metadata = {
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
