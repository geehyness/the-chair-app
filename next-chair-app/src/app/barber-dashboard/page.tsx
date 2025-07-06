// the-chair-app/app/barber-dashboard/page.tsx
import NextLink from 'next/link';
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
// import { logger } from '@/lib/logger';
import BarberDashboardClient from '@/components/BarberDashboardClient'; // Client component
import {
  Box,
  Flex,
  Heading,
  Text,
  Link,
  Container,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';

// Define TypeScript interfaces for our Sanity data types
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
}

interface Barber {
  _id: string;
  name: string;
}

interface LogEntry {
  _type: 'logEntry';
  timestamp: string;
  type: string;
  message: string;
  user: string;
  details?: any;
}

interface Appointment {
  _id: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  customer: Customer; // Dereferenced customer
  barber: Barber;     // Dereferenced barber
  service: Service;   // Dereferenced service
  log: LogEntry[];    // Array of log entries
}

/**
 * Fetches appointments for a specific barber.
 * This is a Server Component function.
 * @param barberId The ID of the barber whose appointments to fetch.
 * @returns A promise that resolves to an array of Appointment objects.
 */
async function getBarberAppointments(barberId: string): Promise<Appointment[]> {
  try {
    // // logger.info(`Dashboard: Fetching appointments for barber ID: ${barberId}`);
    const query = groq`*[_type == "appointment" && barber._ref == $barberId] | order(dateTime asc) {
      _id,
      dateTime,
      status,
      notes,
      customer->{_id, name, email, phone}, // Dereference customer
      barber->{_id, name},                 // Dereference barber
      service->{_id, name, duration, price}, // Dereference service
      log[] // Include the log array
    }`;
    const appointments = await client.fetch(query, { barberId });
    // // logger.info(`Dashboard: Successfully fetched ${appointments.length} appointments for barber ID: ${barberId}`);
    return appointments;
  } catch (error: any) {
    // // logger.error(`Dashboard: Error fetching appointments for barber ID: ${barberId}`, { message: error.message, stack: error.stack });
    return []; // Return empty array on error
  }
}

// Main Barber Dashboard component (Server Component)
export default async function BarberDashboardPage() {
  // --- MOCK AUTHENTICATION ---
  // In a real application, the barberId would come from an authenticated session.
  // For demonstration, replace 'your-barber-id-from-sanity' with an actual barber's _id from your Sanity Studio.
  const MOCK_BARBER_ID = 'your-barber-id-from-sanity'; // <<< IMPORTANT: REPLACE THIS
  const MOCK_BARBER_NAME = 'John Doe'; // Replace with the actual barber's name

  const headerBg = useColorModeValue('gray.800', 'gray.900');
  const headerColor = useColorModeValue('white', 'gray.100');
  const mainBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const footerBg = useColorModeValue('gray.900', 'gray.900');
  const footerText = useColorModeValue('gray.300', 'gray.400');
  const errorBg = useColorModeValue('red.100', 'red.700');
  const errorText = useColorModeValue('red.700', 'red.100');

  if (MOCK_BARBER_ID === 'your-barber-id-from-sanity') {
    // // logger.warn('Dashboard: MOCK_BARBER_ID is not set. Please update app/barber-dashboard/page.tsx with a real barber ID from Sanity.');
    return (
      <Flex minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')} align="center" justify="center" p={4}>
        <Box bg={mainBg} p={8} rounded="lg" shadow="md" textAlign="center">
          <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" p={6} rounded="md" bg={errorBg} color={errorText}>
            <AlertIcon boxSize="40px" mr={0} />
            <Heading as="h1" size="lg" mt={4} mb={2}>Configuration Error</Heading>
            <AlertDescription fontSize="md">
              Please update `app/barber-dashboard/page.tsx` with a valid `MOCK_BARBER_ID` from your Sanity Studio to view the dashboard.
            </AlertDescription>
            <Text fontSize="sm" mt={2} color={useColorModeValue('gray.600', 'gray.300')}>
              You can find barber IDs in your Sanity Studio under the 'Barber' section.
            </Text>
          </Alert>
        </Box>
      </Flex>
    );
  }
  // --- END MOCK AUTHENTICATION ---


  const appointments = await getBarberAppointments(MOCK_BARBER_ID);

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
            The Chair App: Barber Dashboard
          </Heading>
          <Flex as="nav">
            <Link as={NextLink} href="/" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out">
              Home
            </Link>
            <Link as={NextLink} href="/book" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out" ml={4}>
              Book Appointment
            </Link>
            <Link as={NextLink} href="/barber-dashboard" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out" ml={4}>
              My Dashboard
            </Link>
            <Link as={NextLink} href="/admin-reports" p={2} rounded="md" _hover={{ color: 'brand.400' }} transition="0.3s ease-in-out" ml={4}>
              Admin Reports
            </Link>
          </Flex>
        </Container>
      </Flex>

      <Container as="main" maxW="4xl" p={8} my={12} bg={mainBg} rounded="lg" shadow="xl">
        <Heading as="h2" size="xl" textAlign="center" color={headingColor} mb={10}>
          Welcome, {MOCK_BARBER_NAME}!
        </Heading>
        <BarberDashboardClient initialAppointments={appointments} barberId={MOCK_BARBER_ID} />
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
