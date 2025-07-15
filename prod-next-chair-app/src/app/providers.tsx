// src/app/providers.tsx
'use client'

import { ChakraProvider } from '@chakra-ui/react'
import dynamic from 'next/dynamic'
import themes from './theme/theme' // Import your custom theme
import { PageTransitionProvider } from '@/components/PageTransitionProvider' // Import PageTransitionProvider

// Dynamically import ThemeProvider from next-themes with ssr: false
const ThemeProvider = dynamic(
  () => import('next-themes').then((mod) => mod.ThemeProvider),
  { ssr: false }
)

interface ProvidersProps {
  children?: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraProvider theme={themes}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {/* Ensure children are wrapped with PageTransitionProvider for page transitions */}
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </ThemeProvider>
    </ChakraProvider>
  )
}
