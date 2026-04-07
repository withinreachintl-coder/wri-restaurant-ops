import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-dmsans',
})

export const metadata: Metadata = {
  title: 'Daily Ops Checklist - Restaurant Operations Made Simple',
  description:
    'Browser-based app for independent restaurant managers to run opening and closing checklists with digital sign-off',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ops Checklist',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  themeColor: '#D97706',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable}`}>{children}</body>
    </html>
  )
}
