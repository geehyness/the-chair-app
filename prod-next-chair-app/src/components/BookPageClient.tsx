// src/components/BookPageClient.tsx
'use client'

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
  useTheme,
} from '@chakra-ui/react';
import BookingForm from '@/components/BookingForm';

import type { Barber, Service } from '@/app/book/page';

interface BookPageClientProps {
  barbers: Barber[];
  services: Service[];
}

export default function BookPageClient({ barbers, services }: BookPageClientProps) {
  const theme = useTheme();

  // These are already correctly themed
  const headerBg = useColorModeValue(theme.colors.neutral.light['bg-header'], theme.colors.neutral.dark['bg-header']);
  const headerColor = useColorModeValue(theme.colors.neutral.light['text-header'], theme.colors.neutral.dark['text-header']);
  const mainBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const headingColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const footerBg = useColorModeValue(theme.colors.neutral.light['bg-secondary'], theme.colors.neutral.dark['bg-secondary']);
  const footerText = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);

  return (
    <Box minH="100vh" bg={useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary'])} fontFamily="body">
      <Container as="main" maxW="2xl" p={8} my={12} bg={mainBg} rounded="lg" shadow="xl">
        <Heading as="h2" size="xl" textAlign="center" color={headingColor} mb={10}>
          Book Your Appointment
        </Heading>
        <BookingForm barbers={barbers} services={services} />
      </Container>
    </Box>
  );
}
