// src/components/BarberDailyAppointmentsClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  VStack,
  Stack,
  Button,
  useColorModeValue,
  useTheme,
  Tag,
  TagLabel,
  Divider,
  SimpleGrid,
  Image,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO, isToday } from 'date-fns'; // For date formatting and checking

// Import interfaces from the server component
import type { Barber, Appointment } from '@/app/barber-dashboard/manage/page';

interface BarberDailyAppointmentsClientProps {
  barbers: Barber[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[]; // NEW: Add upcoming appointments prop
}

export default function BarberDailyAppointmentsClient({ barbers, todayAppointments, upcomingAppointments }: BarberDailyAppointmentsClientProps) {
  const theme = useTheme();
  const router = useRouter();

  // Color mode values
  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);

  // Group today's appointments by barber for easier display
  const todayAppointmentsByBarber = useMemo(() => {
    const grouped: { [barberId: string]: Appointment[] } = {};
    todayAppointments.forEach(appt => {
      if (!grouped[appt.barber._id]) {
        grouped[appt.barber._id] = [];
      }
      grouped[appt.barber._id].push(appt);
    });

    // Sort appointments within each barber's list by time
    for (const barberId in grouped) {
      grouped[barberId].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    return grouped;
  }, [todayAppointments]);

  // Group upcoming appointments by date, then by barber
  const upcomingAppointmentsGrouped = useMemo(() => {
    const groupedByDate: { [date: string]: { [barberId: string]: Appointment[] } } = {};

    upcomingAppointments.forEach(appt => {
      const apptDate = format(parseISO(appt.dateTime), 'yyyy-MM-dd');
      if (!groupedByDate[apptDate]) {
        groupedByDate[apptDate] = {};
      }
      if (!groupedByDate[apptDate][appt.barber._id]) {
        groupedByDate[apptDate][appt.barber._id] = [];
      }
      groupedByDate[apptDate][appt.barber._id].push(appt);
    });

    // Sort appointments within each barber's list by time
    for (const date in groupedByDate) {
      for (const barberId in groupedByDate[date]) {
        groupedByDate[date][barberId].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      }
    }

    // Sort dates
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());

    return { groupedByDate, sortedDates };
  }, [upcomingAppointments]);


  // Get today's date formatted for display
  const todayFormatted = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <Box bg={bgColor} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8} wrap="wrap">
          <Heading as="h1" size="xl" color={textColorPrimary} mb={{ base: 4, md: 0 }}>
            Barber Dashboard
          </Heading>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Button colorScheme="brand" onClick={() => router.push('/')}>
              View Customer Site
            </Button>
            <Button colorScheme="green" onClick={() => router.push('/admin-reports')}>
              View Reports
            </Button>
            {/* Button to go to the full management dashboard */}
            <Button colorScheme="purple" onClick={() => router.push('/barber-dashboard/manage')}>
              Manage Data
            </Button>
          </Stack>
        </Flex>

        {/* Today's Appointments Section */}
        <Box mb={10}>
          <Heading as="h2" size="lg" color={textColorPrimary} mb={4}>
            Today's Appointments
          </Heading>
          <Text fontSize="xl" color={textColorSecondary} mb={6}>
            Appointments for: <Text as="span" fontWeight="bold" color={textColorPrimary}>{todayFormatted}</Text>
          </Text>

          {barbers.length === 0 ? (
            <Text color={textColorSecondary} textAlign="center" py={10} fontSize="lg">
              No barbers registered. Please add barbers in the "Manage Data" section.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {barbers.map(barber => (
                <Box
                  key={barber._id}
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  boxShadow="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Flex align="center" mb={4}>
                    {barber.imageUrl ? (
                      <Image src={barber.imageUrl} alt={barber.name} boxSize="60px" borderRadius="full" objectFit="cover" mr={4} />
                    ) : (
                      <Box boxSize="60px" borderRadius="full" bg="gray.200" mr={4} />
                    )}
                    <Heading as="h3" size="lg" color={textColorPrimary}>{barber.name}</Heading>
                  </Flex>
                  <Divider mb={4} borderColor={borderColor} />

                  <VStack align="stretch" spacing={3}>
                    {(todayAppointmentsByBarber[barber._id] && todayAppointmentsByBarber[barber._id].length > 0) ? (
                      todayAppointmentsByBarber[barber._id].map(appt => (
                        <Box key={appt._id} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontWeight="semibold" color={textColorPrimary}>
                              {format(parseISO(appt.dateTime), 'hh:mm a')}
                            </Text>
                            <Tag size="sm" colorScheme={appt.status === 'confirmed' ? 'green' : appt.status === 'pending' ? 'orange' : 'red'}>
                              {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                            </Tag>
                          </Flex>
                          <Text fontSize="md" color={textColorSecondary}>
                            <Text as="span" fontWeight="medium">{appt.service.name}</Text> for {appt.customer.name}
                          </Text>
                          <Text fontSize="sm" color={textColorSecondary}>
                            Duration: {appt.service.duration} mins | Price: ${appt.service.price.toFixed(2)}
                          </Text>
                          {appt.notes && (
                            <Text fontSize="sm" fontStyle="italic" color={textColorSecondary} mt={1}>
                              Notes: {appt.notes}
                            </Text>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Text color={textColorSecondary} fontStyle="italic" textAlign="center">No appointments for today.</Text>
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {todayAppointments.length === 0 && barbers.length > 0 && (
            <Text color={textColorSecondary} textAlign="center" py={10} fontSize="lg">
              No appointments scheduled for any barber today.
            </Text>
          )}
        </Box>

        <Divider my={10} borderColor={borderColor} />

        {/* Upcoming Appointments Section */}
        <Box>
          <Heading as="h2" size="lg" color={textColorPrimary} mb={4}>
            Upcoming Appointments
          </Heading>

          {upcomingAppointments.length === 0 ? (
            <Text color={textColorSecondary} textAlign="center" py={10} fontSize="lg">
              No upcoming appointments found.
            </Text>
          ) : (
            <VStack spacing={8} align="stretch">
              {upcomingAppointmentsGrouped.sortedDates.map(date => (
                <Box key={date} p={6} borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                  <Heading as="h3" size="md" color={textColorPrimary} mb={4}>
                    {format(parseISO(date), 'EEEE, MMMM do, yyyy')}
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {barbers.map(barber => {
                      const apptsForBarberOnDate = upcomingAppointmentsGrouped.groupedByDate[date]?.[barber._id] || [];
                      return (
                        <Box
                          key={barber._id}
                          p={4}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={borderColor}
                          bg={useColorModeValue('gray.50', 'gray.700')}
                        >
                          <Flex align="center" mb={3}>
                            {barber.imageUrl ? (
                              <Image src={barber.imageUrl} alt={barber.name} boxSize="40px" borderRadius="full" objectFit="cover" mr={3} />
                            ) : (
                              <Box boxSize="40px" borderRadius="full" bg="gray.300" mr={3} />
                            )}
                            <Text fontWeight="bold" color={textColorPrimary}>{barber.name}</Text>
                          </Flex>
                          <VStack align="stretch" spacing={2}>
                            {apptsForBarberOnDate.length > 0 ? (
                              apptsForBarberOnDate.map(appt => (
                                <Box key={appt._id} borderBottom="1px solid" borderColor={borderColor} pb={2}>
                                  <Flex justify="space-between" align="center" mb={1}>
                                    <Text fontWeight="semibold" color={textColorPrimary}>
                                      {format(parseISO(appt.dateTime), 'hh:mm a')}
                                    </Text>
                                    <Tag size="sm" colorScheme={appt.status === 'confirmed' ? 'green' : appt.status === 'pending' ? 'orange' : 'red'}>
                                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                    </Tag>
                                  </Flex>
                                  <Text fontSize="sm" color={textColorSecondary}>
                                    {appt.service.name} for {appt.customer.name}
                                  </Text>
                                </Box>
                              ))
                            ) : (
                              <Text fontSize="sm" fontStyle="italic" color={textColorSecondary}>No appointments.</Text>
                            )}
                          </VStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
}
