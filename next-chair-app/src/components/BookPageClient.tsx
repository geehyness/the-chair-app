// src/components/BookPageClient.tsx
'use client' // This directive marks this as a Client Component

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Link,
  Container,
  useColorModeValue,
  useTheme, // Import useTheme
} from '@chakra-ui/react';
import BookingForm from '@/components/BookingForm'; // Client component for the form

// Import interfaces from the server component to ensure type consistency
import type { Barber, Service } from '@/app/book/page';

interface BookPageClientProps {
  barbers: Barber[];
  services: Service[];
}

export default function BookPageClient({ barbers, services }: BookPageClientProps) {
  const theme = useTheme(); // Use useTheme hook here

  const headerBg = useColorModeValue(theme.colors.neutral.light['bg-header'], theme.colors.neutral.dark['bg-header']);
  const headerColor = useColorModeValue(theme.colors.neutral.light['text-header'], theme.colors.neutral.dark['text-header']);
  const mainBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']); // Using bg-card for main container
  const headingColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const footerBg = useColorModeValue(theme.colors.neutral.light['bg-secondary'], theme.colors.neutral.dark['bg-secondary']); // Using bg-secondary for footer
  const footerText = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);

  return (
    <Box minH="100vh" bg={useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary'])} fontFamily="body">
      {/* Header - This header is redundant if you have a global Navbar. */}
      {/* If you have a global Navbar in layout.tsx, you can remove this local header. */}
      {/* For now, keeping it as it was in your original file. */}
      <Flex
        as="header"
        bg={headerBg}
        color={headerColor}
        p={6}
        shadow="lg"
        align="center"
        justify="space-between"
      >
        <Container maxW="container.xl" display="flex" justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="lg" fontWeight="extrabold" p={2} rounded="md">
            The Chair App
          </Heading>
          <Flex as="nav">
            <Link as={NextLink} href="/" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out">
              Home
            </Link>
            <Link as={NextLink} href="/book" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out" ml={4}>
              Book Appointment
            </Link>
            <Link as={NextLink} href="/barber-dashboard" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out" ml={4}>
              Barber Dashboard
            </Link>
            <Link as={NextLink} href="/admin-reports" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out" ml={4}>
              Admin Reports
            </Link>
          </Flex>
        </Container>
      </Flex>

      <Container as="main" maxW="2xl" p={8} my={12} bg={mainBg} rounded="lg" shadow="xl">
        <Heading as="h2" size="xl" textAlign="center" color={headingColor} mb={10}>
          Book Your Appointment
        </Heading>
        <BookingForm barbers={barbers} services={services} />
      </Container>

      {/* Footer */}
      <Box as="footer" bg={footerBg} color={footerText} p={6} textAlign="center" roundedTop="md" mt={12}>
        <Container maxW="container.xl">
          <Text>&copy; {new Date().getFullYear()} The Chair App by Synapse Digital. All rights reserved.</Text>
          <Text mt={2}>Designed with ❤️ for a great cut.</Text>
        </Container>
      </Box>
    </Box>
  );
}
