// the-chair-app/app/book/page.tsx
'use client'

import NextLink from 'next/link';
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
import BookingForm from '@/components/BookingForm'; // Client component for the form
// import { logger } from '@/lib/logger';
import {
  Box,
  Flex,
  Heading,
  Text,
  Link,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';

// Define TypeScript interfaces for our Sanity data types
interface Barber {
  _id: string;
  name: string;
  dailyAvailability: Array<{ // New field for granular availability
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
  barbers: { _id: string; name: string }[]; // Dereferenced barbers for convenience
}

/**
 * Fetches all barbers and services required for the booking form.
 * This is a Server Component, so data fetching happens on the server.
 * @returns A promise that resolves to an object containing barbers and services.
 */
async function getBookingData(): Promise<{ barbers: Barber[]; services: Service[] }> {
  try {
    // logger.info('Booking Page: Fetching booking data (barbers and services).');
    const barbersQuery = groq`*[_type == "barber"]{
      _id,
      name,
      dailyAvailability // Fetch the new granular availability field
    }`;
    const servicesQuery = groq`*[_type == "service"]{
      _id,
      name,
      duration,
      price,
      barbers[]->{_id, name} // Dereference barbers to get their IDs and names
    }`;

    const [barbers, services] = await Promise.all([
      client.fetch(barbersQuery),
      client.fetch(servicesQuery)
    ]);

    // logger.info(`Booking Page: Fetched ${barbers.length} barbers and ${services.length} services for booking.`);
    return { barbers, services };
  } catch (error: any) {
    // logger.error('Booking Page: Error fetching booking data:', { message: error.message, stack: error.stack });
    return { barbers: [], services: [] }; // Return empty arrays on error
  }
}

// Main Booking Page component (Server Component)
export default async function BookPage() {
  const { barbers, services } = await getBookingData();

  const headerBg = useColorModeValue('gray.800', 'gray.900');
  const headerColor = useColorModeValue('white', 'gray.100');
  const mainBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const footerBg = useColorModeValue('gray.900', 'gray.900');
  const footerText = useColorModeValue('gray.300', 'gray.400');

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')} fontFamily="body">
      {/* Header */}
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
