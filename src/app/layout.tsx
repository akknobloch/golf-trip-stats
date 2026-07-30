import type { Metadata } from 'next'
import { Lora, Nunito_Sans } from 'next/font/google'
import './globals.css'

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap'
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-lora',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Golf Trip Dashboard',
  description: 'View results from past golf trips, including players, courses, and scores.',
  keywords: ['golf', 'trip dashboard', 'golf scores', 'golf trips', 'results'],
  authors: [{ name: 'Golf Trip Dashboard' }],
  creator: 'Golf Trip Dashboard',
  publisher: 'Golf Trip Dashboard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://golftrip.akknobloch.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Golf Trip Dashboard',
    description: 'View results from past golf trips, including players, courses, and scores.',
    url: 'https://golftrip.akknobloch.com',
    siteName: 'Golf Trip Dashboard',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Golf Trip Dashboard - Results from past golf trips',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golf Trip Dashboard',
    description: 'View results from past golf trips, including players, courses, and scores.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunitoSans.variable} ${lora.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Golf Trip Dashboard" />
        
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className={nunitoSans.className}>
        {children}
      </body>
    </html>
  )
}
