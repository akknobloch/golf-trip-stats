import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SampleDataInitializer from '@/components/SampleDataInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Golf Trip Manager',
  description: 'Track and manage your golf trip results over the years',
  keywords: ['golf', 'trip manager', 'score tracking', 'golf courses', 'player management'],
  authors: [{ name: 'Golf Trip Manager' }],
  creator: 'Golf Trip Manager',
  publisher: 'Golf Trip Manager',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://golf-trip-manager.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Golf Trip Manager',
    description: 'Track and manage your golf trip results over the years. Organize scores, players, courses, and trip history with ease.',
    url: 'https://golf-trip-manager.vercel.app',
    siteName: 'Golf Trip Manager',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Golf Trip Manager - Track and manage your golf trip results over the years',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golf Trip Manager',
    description: 'Track and manage your golf trip results over the years. Organize scores, players, courses, and trip history with ease.',
    images: ['/og-image.svg'],
    creator: '@golftripmanager',
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
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        
        {/* Apple Touch Icons for iPhone home screen */}
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/favicon.png" />
        
        {/* Apple-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Golf Trip Manager" />
        
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className={inter.className}>
        <SampleDataInitializer />
        {children}
      </body>
    </html>
  )
}


