// src/theme/system.ts
import { createSystem, defineConfig, defaultConfig } from '@chakra-ui/react'

export const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: {
        colorSchemes: {
          light: {},
          dark: {},
        },
      },
      defaultColorScheme: 'dark', // force dark
    },
  })
)
