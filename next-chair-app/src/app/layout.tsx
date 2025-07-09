// app/layout.tsx
'use client' // This must be a client component to use usePathname

import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers' // Import the new provider
import { Navbar } from '@/components/Navbar' // Import your Navbar component
import { usePathname } from 'next/navigation' // Import usePathname

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname(); // Get the current path

  // Determine Navbar type based on pathname
  const isDashboardPage = pathname.startsWith('/barber-dashboard') || pathname.startsWith('/admin-reports');
  const navbarType = isDashboardPage ? 'dashboard' : 'customer';

  // Example logout handler (implement actual logout logic)
  const handleDashboardLogout = () => {
    alert('Logging out from dashboard...');
    // Implement actual logout logic here (e.g., clear session, redirect to login)
    // router.push('/login');
  };

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Navbar
            type={navbarType}
            appName="The Chair App"
            onDashboardLogout={handleDashboardLogout}
            // You can pass dynamic links here if needed, though for a simple app
            // hardcoding within Navbar for customer/dashboard might be fine.
            // Example for dashboard:
            // links={isDashboardPage ? [{href: '/admin-settings', label: 'Settings'}] : []}
            
          />
          {children}
        </Providers>
      </body>
    </html>
  )
}