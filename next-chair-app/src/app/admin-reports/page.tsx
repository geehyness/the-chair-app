// the-chair-app/app/admin-reports/page.tsx
import NextLink from 'next/link';
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
// import { logger } from '@/lib/logger';
import {
  Box,
  Flex,
  Heading,
  Text,
  Link,
  Container,
  SimpleGrid,
  List,
  ListItem,
  useColorModeValue,
} from '@chakra-ui/react';

// Define TypeScript interfaces for data required for reports
interface Appointment {
  _id: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  service: {
    _id: string;
    name: string;
    duration: number;
    price: number;
  };
  barber: {
    _id: string;
    name: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
  };
}

/**
 * Fetches all appointments (completed, cancelled, etc.) and related data for reporting.
 * This is a Server Component function.
 * @returns A promise that resolves to an array of Appointment objects with dereferenced data.
 */
async function getReportData(): Promise<Appointment[]> {
  try {
    logger.info('Admin Reports: Fetching all relevant appointment data for reports.');
    const query = groq`*[_type == "appointment"]{
      _id,
      dateTime,
      status,
      service->{_id, name, duration, price},
      barber->{_id, name},
      customer->{_id, name, email}
    }`;
    const appointments = await client.fetch(query);
    logger.info(`Admin Reports: Successfully fetched ${appointments.length} appointments for reporting.`);
    return appointments;
  } catch (error: any) {
    logger.error('Admin Reports: Error fetching report data:', { message: error.message, stack: error.stack });
    return []; // Return empty array on error
  }
}

// Helper function to calculate metrics
const calculateMetrics = (appointments: Appointment[]) => {
  const metrics = {
    totalAppointments: appointments.length,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0,
    totalRevenue: 0,
    revenueByBarber: {} as { [key: string]: number },
    appointmentsByService: {} as { [key: string]: number },
    // newCustomers: 0, // This would require more complex logic with customer creation timestamps
  };

  // const uniqueCustomers = new Set<string>(); // For unique customer count, if needed

  appointments.forEach(appt => {
    // Count appointment statuses
    if (appt.status === 'completed') {
      metrics.completedAppointments++;
      metrics.totalRevenue += appt.service.price;

      // Revenue by barber
      if (appt.barber && appt.barber.name) {
        metrics.revenueByBarber[appt.barber.name] = (metrics.revenueByBarber[appt.barber.name] || 0) + appt.service.price;
      }
    } else if (appt.status === 'cancelled') {
      metrics.cancelledAppointments++;
    } else if (appt.status === 'pending' || appt.status === 'confirmed') {
      metrics.pendingAppointments++;
    }

    // Appointments by service
    if (appt.service && appt.service.name) {
      metrics.appointmentsByService[appt.service.name] = (metrics.appointmentsByService[appt.service.name] || 0) + 1;
    }

    // Track unique customers (for new customers, you'd need creation date on customer schema)
    // uniqueCustomers.add(appt.customer._id);
  });

  // For 'newCustomers', you'd typically query the customer schema for customers created within a specific period.
  // For simplicity, we'll just show unique customers who have booked an appointment.
  // metrics.newCustomers = uniqueCustomers.size; // This is actually unique customers who booked, not new customers in a period.

  return metrics;
};


// Main Admin Reports component (Server Component)
export default async function AdminReportsPage() {
  const allAppointments = await getReportData();
  const metrics = calculateMetrics(allAppointments);

  const headerBg = useColorModeValue('gray.800', 'gray.900');
  const headerColor = useColorModeValue('white', 'gray.100');
  const mainBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const footerBg = useColorModeValue('gray.900', 'gray.900');
  const footerText = useColorModeValue('gray.300', 'gray.400');
  const textColor = useColorModeValue('gray.700', 'gray.200');

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
            The Chair App: Admin Reports
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

      <Container as="main" maxW="6xl" p={8} my={12} bg={mainBg} rounded="lg" shadow="xl">
        <Heading as="h2" size="xl" textAlign="center" color={headingColor} mb={10}>
          Business Reports Overview
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={10}>
          <Box bg={useColorModeValue('blue.50', 'blue.800')} p={6} rounded="lg" shadow="md" border="1px" borderColor={useColorModeValue('blue.200', 'blue.700')}>
            <Heading as="h3" size="md" color={useColorModeValue('blue.800', 'blue.100')} mb={2}>Total Appointments</Heading>
            <Text fontSize="4xl" fontWeight="bold" color={useColorModeValue('blue.600', 'blue.300')}>{metrics.totalAppointments}</Text>
          </Box>
          <Box bg={useColorModeValue('green.50', 'green.800')} p={6} rounded="lg" shadow="md" border="1px" borderColor={useColorModeValue('green.200', 'green.700')}>
            <Heading as="h3" size="md" color={useColorModeValue('green.800', 'green.100')} mb={2}>Completed Appointments</Heading>
            <Text fontSize="4xl" fontWeight="bold" color={useColorModeValue('green.600', 'green.300')}>{metrics.completedAppointments}</Text>
          </Box>
          <Box bg={useColorModeValue('red.50', 'red.800')} p={6} rounded="lg" shadow="md" border="1px" borderColor={useColorModeValue('red.200', 'red.700')}>
            <Heading as="h3" size="md" color={useColorModeValue('red.800', 'red.100')} mb={2}>Cancelled Appointments</Heading>
            <Text fontSize="4xl" fontWeight="bold" color={useColorModeValue('red.600', 'red.300')}>{metrics.cancelledAppointments}</Text>
          </Box>
          <Box bg={useColorModeValue('yellow.50', 'yellow.800')} p={6} rounded="lg" shadow="md" border="1px" borderColor={useColorModeValue('yellow.200', 'yellow.700')}>
            <Heading as="h3" size="md" color={useColorModeValue('yellow.800', 'yellow.100')} mb={2}>Pending/Confirmed</Heading>
            <Text fontSize="4xl" fontWeight="bold" color={useColorModeValue('yellow.600', 'yellow.300')}>{metrics.pendingAppointments}</Text>
          </Box>
          <Box bg={useColorModeValue('purple.50', 'purple.800')} p={6} rounded="lg" shadow="md" border="1px" borderColor={useColorModeValue('purple.200', 'purple.700')}>
            <Heading as="h3" size="md" color={useColorModeValue('purple.800', 'purple.100')} mb={2}>Total Revenue</Heading>
            <Text fontSize="4xl" fontWeight="bold" color={useColorModeValue('purple.600', 'purple.300')}>R{metrics.totalRevenue.toFixed(2)}</Text>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box bg={cardBg} p={6} rounded="lg" shadow="md" border="1px" borderColor={cardBorder}>
            <Heading as="h3" size="md" color={headingColor} mb={4}>Revenue by Barber</Heading>
            {Object.keys(metrics.revenueByBarber).length > 0 ? (
              <List spacing={2}>
                {Object.entries(metrics.revenueByBarber).map(([barberName, revenue]) => (
                  <ListItem key={barberName} display="flex" justifyContent="space-between" alignItems="center" color={textColor}>
                    <Text>{barberName}:</Text>
                    <Text fontWeight="bold">R{revenue.toFixed(2)}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color={textColor}>No revenue data available yet.</Text>
            )}
          </Box>

          <Box bg={cardBg} p={6} rounded="lg" shadow="md" border="1px" borderColor={cardBorder}>
            <Heading as="h3" size="md" color={headingColor} mb={4}>Appointments by Service</Heading>
            {Object.keys(metrics.appointmentsByService).length > 0 ? (
              <List spacing={2}>
                {Object.entries(metrics.appointmentsByService).map(([serviceName, count]) => (
                  <ListItem key={serviceName} display="flex" justifyContent="space-between" alignItems="center" color={textColor}>
                    <Text>{serviceName}:</Text>
                    <Text fontWeight="bold">{count}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color={textColor}>No service booking data available yet.</Text>
            )}
          </Box>
        </SimpleGrid>
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
