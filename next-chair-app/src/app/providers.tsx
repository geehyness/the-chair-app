// src/components/Providers.tsx
'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'
import { system } from '../app/theme/system'

interface ProvidersProps {
  children?: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider
        attribute="class"             // use class strategy
        defaultTheme="dark"           // start in dark mode
        enableSystem={false}          // ignore system preference
        disableTransitionOnChange     // prevent flashes on mount
      >
        {children}
      </ThemeProvider>
    </ChakraProvider>
  )
}
