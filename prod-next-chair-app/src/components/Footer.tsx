// src/components/Footer.tsx
'use client';

import React from 'react';
import {
  Box,
  Text,
  Container,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';

interface FooterProps {
  appName?: string;
}

export function Footer({ appName = 'The Chair App' }: FooterProps) {
  const theme = useTheme();

  const footerBg = useColorModeValue(theme.colors.neutral.light['bg-secondary'], theme.colors.neutral.dark['bg-secondary']);
  const footerText = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);

  return (
    <Box as="footer" bg={footerBg} color={footerText} p={6} textAlign="center" mt="auto">
      <Container maxW="container.xl">
        <Text>&copy; {new Date().getFullYear()} {appName} by Synapse Digital. All rights reserved.</Text>
        <Text mt={2}>Designed with ❤️ for a great cut.</Text>
      </Container>
    </Box>
  );
}
