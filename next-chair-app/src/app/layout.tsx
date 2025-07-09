// app/layout.tsx
'use client' // This must be a client component to use usePathname

import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers' // Import the new provider
import { Navbar } from '@/components/Navbar' // Import your Navbar component
import { Footer } from '@/components/Footer'; // <--- NEW: Import the Footer component
import { usePathname } from 'next/navigation' // Import usePathname
import { Box, Text, Container, useColorModeValue, useTheme } from '@chakra-ui/react'; // Keep useTheme for other potential uses if needed, but not strictly for footer colors now

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname(); // Get the current path
  // const theme = useTheme(); // No longer explicitly needed here for footer colors, as Footer component handles it.

  // Determine Navbar type based on pathname
  const isDashboardPage = pathname.startsWith('/barber-dashboard') || pathname.startsWith('/admin-reports');
  const navbarType = isDashboardPage ? 'dashboard' : 'customer';

  // Example logout handler (implement actual logout logic)
  const handleDashboardLogout = () => {
    // In a real app, you'd clear auth tokens, redirect, etc.
    alert('Logging out from dashboard...'); // Replace with proper UI/logic
    // router.push('/login'); // Example redirect
  };

  // Footer colors are now managed within the Footer component itself
  // const footerBg = useColorModeValue(theme.colors.neutral.light['bg-secondary'], theme.colors.neutral.dark['bg-secondary']);
  // const footerText = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);


  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <Navbar
            type={navbarType}
            appName="The Chair App"
            onDashboardLogout={handleDashboardLogout}
          />
          {/* Add top padding to main content to account for fixed navbar height */}
          <Box pt="64px" flex="1" className={inter.className}>
            {children}
          </Box>

          {/* Global Footer Component */}
          <Footer appName="The Chair App" /> {/* <--- NEW: Use the Footer component here */}
        </Providers>
      </body>
    </html>
  )
}
