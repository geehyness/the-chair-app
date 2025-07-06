// src/app/theme/theme.ts
// Rename this file from system.ts to theme.ts

import { extendTheme } from '@chakra-ui/react';

// Define your custom theme using extendTheme
const theme = extendTheme({
  // Example colors - you can expand this based on your design
  colors: {
    brand: {
      50: '#f0e6ff',
      100: '#d2baff',
      200: '#b38eff',
      300: '#9462ff',
      400: '#7636ff',
      500: '#570aff', // Primary purple
      600: '#4700e6',
      700: '#3700b3',
      800: '#270080',
      900: '#17004d',
    },
  },
  // Configure color mode (dark by default, as per your previous setup)
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false, // Explicitly disable system preference
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
      },
      // You can add more global styles here if needed
    }),
  },
  components: {
    // Example: Button styling
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'full',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'purple.500' : 'purple.600',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'purple.600' : 'purple.700',
          },
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'purple.300' : 'purple.500',
          color: props.colorMode === 'dark' ? 'purple.300' : 'purple.500',
          _hover: {
            bg: props.colorMode === 'dark' ? 'purple.700' : 'purple.50',
            color: props.colorMode === 'dark' ? 'white' : 'purple.700',
          },
        }),
      },
    },
    // Add other component customizations here
  },
});

export default theme;
