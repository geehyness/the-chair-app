'use client'

import { ChakraProvider } from '@chakra-ui/react'
import dynamic from 'next/dynamic'
import themes from './theme/theme'

// Dynamically import ThemeProvider with ssr: false
const ThemeProvider = dynamic(
  () => import('next-themes').then((mod) => mod.ThemeProvider),
  { ssr: false }
)

interface ProvidersProps {
  children?: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraProvider value={themes}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ChakraProvider>
  )
}