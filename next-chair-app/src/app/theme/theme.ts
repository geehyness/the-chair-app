// src/app/theme/theme.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools'; // Import mode for color mode dependent styles

// 1. Color Mode Configuration
// You can adjust the initial color mode here
const config: ThemeConfig = {
  initialColorMode: 'dark', // 'dark' | 'light' | 'system'
  useSystemColorMode: false, // Set to true if you want to respect OS theme preference
};

// 2. Define your core color palette using semantic names
// THIS IS REVERTED TO ORIGINAL PURPLE BRAND COLORS
const colors = {
  // Brand Colors (your primary brand identity) - REVERTED TO PURPLE
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
  // Accent Color (for highlights, call-to-actions, etc.) - Kept as is
  accent: {
    50: '#E6FFFA', // A light teal/cyan
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795', // Primary accent teal
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
  // Neutral Colors (for text, backgrounds, borders) - Kept as is
  neutral: {
    // Dark mode specific neutrals (lighter shades for dark background)
    dark: {
      'bg-primary': 'gray.900',
      'bg-secondary': 'gray.800',
      'bg-card': 'gray.700',
      'bg-input': 'gray.700',
      'border-color': 'gray.600',
      'text-primary': 'whiteAlpha.900',
      'text-secondary': 'gray.300',
      'text-muted': 'gray.500',
      'focus-ring': 'brand.300', // A lighter purple for focus on dark mode
      'bg-header': 'gray.800', // ADDED: Specific header background for dark mode
    },
    // Light mode specific neutrals (darker shades for light background)
    light: {
      'bg-primary': 'gray.50',
      'bg-secondary': 'gray.100',
      'bg-card': 'white',
      'bg-input': 'gray.200',
      'border-color': 'gray.200',
      'text-primary': 'gray.900',
      'text-secondary': 'gray.700',
      'text-muted': 'gray.500',
      'focus-ring': 'brand.500', // A darker purple for focus on light mode
      'bg-header': 'white', // ADDED: Specific header background for light mode
    },
  },
  // Status Colors (success, error, warning, info) - Kept as is
  status: {
    success: 'green.500',
    error: 'red.500',
    warning: 'orange.400',
    info: 'blue.300',
  },
};

// 3. Global Styles (applied to `body` and other elements) - Kept as is (brand color for links updated implicitly)
// Use the `mode` helper for color mode specific styles
const styles = {
  global: (props: Record<string, any>) => ({
    body: {
      fontFamily: 'body',
      color: mode(colors.neutral.light['text-primary'], colors.neutral.dark['text-primary'])(props),
      bg: mode(colors.neutral.light['bg-primary'], colors.neutral.dark['bg-primary'])(props),
      lineHeight: 'base',
    },
    a: {
      color: mode(colors.brand[600], colors.brand[300])(props),
      _hover: {
        textDecoration: 'underline',
      },
    },
    // You can add more global styles here for headings, paragraphs etc.
  }),
};

// 4. Typography (fonts, font sizes, font weights, line heights) - Kept as is
const typography = {
  fonts: {
    heading: `'Inter', sans-serif`, // Using Inter as per your setup
    body: `'Inter', sans-serif`,
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },
  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    normal: 'normal',
    none: '1',
    shorter: '1.25',
    short: '1.375',
    base: '1.5',
    tall: '1.625',
    taller: '2',
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// 5. Spacing - Kept as is
const spacing = {
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    // ... continue up to 10 or 20 for consistent spacing
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
    // You can add more specific spacing like `md`, `lg`
    'layout-padding-x': '1.5rem',
    'layout-padding-y': '2rem',
  },
};

// 6. Breakpoints (for responsive design) - Kept as is
const breakpoints = {
  sm: '30em', // 480px
  md: '48em', // 768px
  lg: '62em', // 992px
  xl: '80em', // 1280px
  '2xl': '96em', // 1536px
};

// 7. Component-specific styles (e.g., Button, Input, Card) - UPDATED Button here
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: 'md', // Changed from 'full' to 'md' for a slightly less rounded look
      _focus: (props: Record<string, any>) => ({ // Use mode for focus ring as well
        boxShadow: `0 0 0 3px ${mode(colors.brand[300], colors.brand[500])(props)}`, // Use a lighter purple for dark mode, original purple for light mode
      }),
    },
    variants: {
      solid: (props: Record<string, any>) => ({
        bg: '#FFFFFF', // Explicitly set background to white
        color: 'gray.800', // Set text color to dark gray for contrast
        _hover: {
          bg: '#F0F0F0', // Slightly off-white for hover effect
          _disabled: {
            bg: mode('gray.300', 'gray.600')(props), // Ensure disabled state is clear
          },
        },
        _active: {
          bg: '#E0E0E0', // Even more off-white for active state
        },
      }),
      // Other variants (outline, ghost, accent) will still use the original 'brand' colors
      outline: (props: Record<string, any>) => ({
        borderColor: mode(colors.brand[500], colors.brand[400])(props),
        color: mode(colors.brand[500], colors.brand[300])(props),
        _hover: {
          bg: mode(colors.brand[50], colors.neutral.dark['bg-secondary'])(props),
        },
      }),
      ghost: (props: Record<string, any>) => ({
        color: mode(colors.brand[600], colors.brand[300])(props),
        _hover: {
          bg: mode(colors.brand[50], colors.neutral.dark['bg-secondary'])(props),
        },
      }),
      accent: (props: Record<string, any>) => ({
        bg: mode(colors.accent[500], colors.accent[400])(props),
        color: 'white',
        _hover: {
          bg: mode(colors.accent[600], colors.accent[500])(props),
        },
      }),
    },
    defaultProps: {
      size: 'md',
      variant: 'solid',
    },
  },
  Input: {
    variants: {
      outline: (props: Record<string, any>) => ({
        field: {
          bg: mode(colors.neutral.light['bg-input'], colors.neutral.dark['bg-input'])(props),
          borderColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
          _hover: {
            borderColor: mode(colors.brand[400], colors.brand[300])(props),
          },
          _focus: {
            borderColor: mode(colors.brand[500], colors.brand[300])(props),
            boxShadow: `0 0 0 1px ${mode(colors.brand[500], colors.brand[300])(props)}`,
          },
          color: mode(colors.neutral.light['text-primary'], colors.neutral.dark['text-primary'])(props),
        },
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },
  Textarea: {
    variants: {
      outline: (props: Record<string, any>) => ({
        bg: mode(colors.neutral.light['bg-input'], colors.neutral.dark['bg-input'])(props),
        borderColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
        _hover: {
          borderColor: mode(colors.brand[400], colors.brand[300])(props),
        },
        _focus: {
          borderColor: mode(colors.brand[500], colors.brand[300])(props),
          boxShadow: `0 0 0 1px ${mode(colors.brand[500], colors.brand[300])(props)}`,
        },
        color: mode(colors.neutral.light['text-primary'], colors.neutral.dark['text-primary'])(props),
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },
  Select: {
    variants: {
      outline: (props: Record<string, any>) => ({
        field: {
          bg: mode(colors.neutral.light['bg-input'], colors.neutral.dark['bg-input'])(props),
          borderColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
          _hover: {
            borderColor: mode(colors.brand[400], colors.brand[300])(props),
          },
          _focus: {
            borderColor: mode(colors.brand[500], colors.brand[300])(props),
            boxShadow: `0 0 0 1px ${mode(colors.brand[500], colors.brand[300])(props)}`,
          },
          color: mode(colors.neutral.light['text-primary'], colors.neutral.dark['text-primary'])(props),
        },
        icon: {
            color: mode(colors.neutral.light['text-secondary'], colors.neutral.dark['text-secondary'])(props),
        }
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },
  Link: {
    baseStyle: (props: Record<string, any>) => ({
      color: mode(colors.brand[600], colors.brand[300])(props),
      _hover: {
        textDecoration: 'none', // Chakra UI defaults to underline, remove for clean hover
        color: mode(colors.brand[700], colors.brand[200])(props),
      },
    }),
  },
  Container: {
    baseStyle: {
      maxWidth: 'container.xl', // Ensures consistent maximum width for content
      paddingX: { base: 'layout-padding-x', md: 'layout-padding-x-md' }, // Custom padding
      paddingY: { base: 'layout-padding-y', md: 'layout-padding-y-md' },
    },
  },
  // Add more components as needed (e.g., Card, Modal, Table, etc.)
  Card: {
    baseStyle: (props: Record<string, any>) => ({
      container: {
        bg: mode(colors.neutral.light['bg-card'], colors.neutral.dark['bg-card'])(props),
        borderRadius: 'lg',
        boxShadow: mode('sm', 'dark-lg')(props), // Adjust shadow for dark mode
      },
      header: {
        color: mode(colors.neutral.light['text-primary'], colors.neutral.dark['text-primary'])(props),
      },
      body: {
        color: mode(colors.neutral.light['text-secondary'], colors.neutral.dark['text-secondary'])(props),
      }
    })
  },
  Table: {
    baseStyle: (props: Record<string, any>) => ({
      th: {
        color: mode(colors.neutral.light['text-primary'], colors.neutral.dark['text-primary'])(props),
        borderColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
      },
      td: {
        color: mode(colors.neutral.light['text-secondary'], colors.neutral.dark['text-secondary'])(props),
        borderColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
      },
      // Override default striped variant if needed
      variants: {
        simple: {
          th: {
            borderBottomWidth: '1px',
            borderBottomColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
          },
          td: {
            borderBottomWidth: '1px',
            borderBottomColor: mode(colors.neutral.light['border-color'], colors.neutral.dark['border-color'])(props),
          },
        },
      },
    }),
  },
};


// Combine all parts into the theme
const theme = extendTheme({
  config,
  colors,
  ...typography, // Spread typography properties directly
  ...spacing,   // Spread spacing properties directly
  breakpoints,
  styles,
  components,
  // Add other theme properties as needed (e.g., z-indices, shadows)
  shadows: {
    outline: `0 0 0 3px ${colors.brand[300]}`, // Custom focus outline - uses brand.300 (lighter purple)
    'dark-lg': 'rgba(0, 0, 0, 0.4) 0px 10px 15px -3px, rgba(0, 0, 0, 0.2) 0px 4px 6px -2px',
  },
});

export default theme;