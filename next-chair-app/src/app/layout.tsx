// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers' // Import the new provider

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'The Chair App',
  description: 'Salon booking made easy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {/* Wrap your children with the new Providers component */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
