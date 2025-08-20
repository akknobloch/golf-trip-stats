import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SampleDataInitializer from '@/components/SampleDataInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Golf Trip Manager',
  description: 'Track and manage your golf trip results over the years',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
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


