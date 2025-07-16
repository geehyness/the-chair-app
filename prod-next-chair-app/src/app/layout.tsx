// app/layout.tsx
'use client' // This must be a client component to use usePathname

import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers' // Import the new provider
import { Navbar } from '@/components/Navbar' // Import your Navbar component
import { Footer } from '@/components/Footer'; // <--- NEW: Import the Footer component
import { usePathname } from 'next/navigation' // Import usePathname
import { Box, Text, Container, useColorModeValue, useTheme } from '@chakra-ui/react'; // Keep useTheme for other potential uses if needed, but not strictly for footer colors now
import { client, urlFor } from '@/lib/sanity'; // Import Sanity client and urlFor
import { groq } from 'next-sanity'; // Import groq for Sanity queries
import React, { useState, useEffect } from 'react'; // ADDED: Import useState and useEffect

const inter = Inter({ subsets: ['latin'] })

// Define a simple interface for SiteSettings to get the logo
interface SiteSettings {
  title?: string;
  logo?: any; // Sanity image object
}

// Function to fetch site settings, specifically the logo
async function getSiteSettings(): Promise<SiteSettings | null> {
  const query = groq`
    *[_type == "siteSettings"][0]{
      title,
      logo
    }
  `;
  try {
    const settings = await client.fetch(query);
    return settings;
  } catch (error) {
    console.error("Failed to fetch site settings for Navbar:", error);
    return null;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  // Determine if the current page is part of the dashboard/admin section
  const isDashboardPage = pathname.startsWith('/barber-dashboard') || pathname.startsWith('/barber-dashboard/admin-reports') || pathname.startsWith('/barber-dashboard/messages') || pathname.startsWith('/admin');
  const navbarType = isDashboardPage ? 'dashboard' : 'customer';

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [siteLogoUrl, setSiteLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getSiteSettings();
      if (settings) {
        setSiteSettings(settings);
        if (settings.logo) {
          setSiteLogoUrl(urlFor(settings.logo).url());
        }
      }
    };
    fetchSettings();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* PWA Manifest Link */}
        <link rel="manifest" href="/manifest.json" />
        {/* Apple Touch Icon (optional, for iOS home screen icon) */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Theme color for address bar on mobile browsers */}
        <meta name="theme-color" content="#326AA0" />
      </head>
      <body>
        <Providers>
          <Navbar
            type={navbarType}
            appName={siteSettings?.title || "The Chair App"} // Use fetched title or default
            siteLogoUrl={siteLogoUrl} // Pass the fetched logo URL to Navbar
          />
          {/* Add top padding to main content to account for fixed navbar height */}
          <Box pt="64px" flex="1" className={inter.className}>
            {children}
          </Box>

          {/* Global Footer Component */}
          <Footer appName="The Chair App" />
        </Providers>
      </body>
    </html>
  )
}
