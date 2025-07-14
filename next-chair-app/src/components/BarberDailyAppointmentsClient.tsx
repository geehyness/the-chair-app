// src/components/BarberDailyAppointmentsClient.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Divider,
  SimpleGrid,
  Image,
  useToast,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  format,
  parseISO,
  isToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  // isWithinInterval, // Not directly used in current analytics logic but useful for general date filtering
} from 'date-fns';

// Import Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart, // Still imported but not used for services chart
  Pie, // Still imported but not used for services chart
  Cell,
} from 'recharts';

import { writeClient } from '@/lib/sanity';

interface Appointment {
  _id: string;
  customer: { _id: string; name: string };
  barber: { _id: string; name: string };
  service: { _id: string; name: string; duration: number; price: number };
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

interface Barber {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface Service {
  _id: string;
  name: string;
  price: number; // Ensure service price is available for profitability calculation
}

interface BarberDailyAppointmentsClientProps {
  barbers: Barber[];
  services: Service[]; // Pass services for analytics, now including price
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
}

// Define a color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];


export default function BarberDailyAppointmentsClient({ barbers, services, todayAppointments, upcomingAppointments }: BarberDailyAppointmentsClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const { isOpen: isConfirmCancelOpen, onOpen: onConfirmCancelOpen, onClose: onConfirmCancelClose } = useDisclosure();
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const apptCardBgLight = useColorModeValue('gray.50', 'gray.700');
  const apptCardBorderLight = useColorModeValue('gray.200', 'gray.600');
  // Define inputBg inside the component as it uses a hook
  const inputBg = useColorModeValue('white', 'gray.700'); // Moved inside the component


  useEffect(() => {
    const combinedAppointments = [...todayAppointments, ...upcomingAppointments];
    setAllAppointments(combinedAppointments);
    setLoading(false);
  }, [todayAppointments, upcomingAppointments]);

  const statusColumns = useMemo(() => [
    { id: 'pending', title: 'Pending', colorScheme: 'orange' },
    { id: 'confirmed', title: 'Confirmed', colorScheme: 'green' },
    { id: 'completed', title: 'Completed', colorScheme: 'blue' },
    { id: 'cancelled', title: 'Cancelled', colorScheme: 'red' },
  ], []);

  const todayAppointmentsGroupedByStatus = useMemo(() => {
    const grouped: { [status: string]: Appointment[] } = {
      pending: [],
      confirmed: [],
      completed: [],
      cancelled: [],
    };

    allAppointments
      .filter(appt => isToday(parseISO(appt.dateTime)))
      .forEach(appt => {
        if (grouped[appt.status]) {
          grouped[appt.status].push(appt);
        }
      });

    for (const status in grouped) {
      grouped[status].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    return grouped;
  }, [allAppointments]);

  const upcomingAppointmentsGrouped = useMemo(() => {
    const groupedByDate: { [date: string]: { [barberId: string]: Appointment[] } } = {};

    allAppointments
      .filter(appt => !isToday(parseISO(appt.dateTime)))
      .forEach(appt => {
        const apptDate = format(parseISO(appt.dateTime), 'yyyy-MM-dd');
        if (!groupedByDate[apptDate]) {
          groupedByDate[apptDate] = {};
        }
        if (!groupedByDate[apptDate][appt.barber._id]) {
          groupedByDate[apptDate][appt.barber._id] = [];
        }
        groupedByDate[apptDate][appt.barber._id].push(appt);
      });

    for (const date in groupedByDate) {
      for (const barberId in groupedByDate[date]) {
        groupedByDate[date][barberId].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      }
    }

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());

    return { groupedByDate, sortedDates };
  }, [allAppointments]);

  const handleConfirmAppointment = async (appointmentId: string) => {
    setLoading(true);
    try {
      await writeClient
        .patch(appointmentId)
        .set({ status: 'confirmed' })
        .commit();

      setAllAppointments(prevAppointments =>
        prevAppointments.map(appt =>
          appt._id === appointmentId ? { ...appt, status: 'confirmed' } : appt
        )
      );

      toast({
        title: 'Appointment Confirmed.',
        description: 'Appointment status updated to Confirmed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm appointment.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (appointmentId: string, currentStatus: Appointment['status']) => {
    setLoading(true);
    const newStatus: Appointment['status'] = currentStatus === 'completed' ? 'confirmed' : 'completed';

    try {
      await writeClient
        .patch(appointmentId)
        .set({ status: newStatus })
        .commit();

      setAllAppointments(prevAppointments =>
        prevAppointments.map(appt =>
          appt._id === appointmentId ? { ...appt, status: newStatus } : appt
        )
      );

      toast({
        title: 'Appointment status updated.',
        description: `Appointment marked as ${newStatus}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment status.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId);
    onConfirmCancelOpen();
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancelId) return;
    setLoading(true);
    try {
      await writeClient
        .patch(appointmentToCancelId)
        .set({ status: 'cancelled' })
        .commit();

      toast({
        title: 'Appointment cancelled.',
        description: 'The appointment has been successfully cancelled.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setAllAppointments(prevAppointments =>
        prevAppointments.map(appt =>
          appt._id === appointmentToCancelId ? { ...appt, status: 'cancelled' } : appt
        )
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      onConfirmCancelClose();
      setAppointmentToCancelId(null);
    }
  };

  // --- Analytics Logic ---
  const analyticsData = useMemo(() => {
    const completedAppointments = allAppointments.filter(appt => appt.status === 'completed');

    let timeSeriesMap: { [key: string]: { completed: number; revenue: number; } } = {};
    let servicePerformanceMap: { [serviceId: string]: { count: number; totalRevenue: number; } } = {};
    let activeBarbersMap: { [barberId: string]: number } = {};

    let totalCompletedAppointments = 0;
    let totalRevenue = 0;

    // Determine the interval for time series data
    let intervalDates: Date[] = [];
    if (completedAppointments.length > 0) {
      // Use min/max date from completed appointments
      const minDate = completedAppointments.reduce((min, appt) =>
        (parseISO(appt.dateTime) < min ? parseISO(appt.dateTime) : min), parseISO(completedAppointments[0].dateTime));
      const maxDate = completedAppointments.reduce((max, appt) =>
        (parseISO(appt.dateTime) > max ? parseISO(appt.dateTime) : max), parseISO(completedAppointments[0].dateTime));

      // Ensure at least one interval is covered even if only one appointment exists
      const effectiveStartDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      const effectiveEndDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

      if (selectedAnalyticsPeriod === 'daily') {
        intervalDates = eachDayOfInterval({ start: startOfWeek(effectiveStartDate), end: endOfWeek(effectiveEndDate) });
      } else if (selectedAnalyticsPeriod === 'weekly') {
        intervalDates = eachWeekOfInterval({ start: startOfYear(effectiveStartDate), end: endOfYear(effectiveEndDate) });
      } else if (selectedAnalyticsPeriod === 'monthly') {
        intervalDates = eachMonthOfInterval({ start: startOfYear(effectiveStartDate), end: endOfYear(effectiveEndDate) });
      } else if (selectedAnalyticsPeriod === 'yearly') {
        intervalDates = eachYearOfInterval({ start: startOfYear(effectiveStartDate), end: endOfYear(effectiveEndDate) });
      }
    }

    // Initialize timeSeriesMap with all intervals to ensure continuous data
    intervalDates.forEach(date => {
      let key = '';
      if (selectedAnalyticsPeriod === 'daily') {
        key = format(date, 'MMM dd');
      } else if (selectedAnalyticsPeriod === 'weekly') {
        key = `Week ${format(date, 'w')}, ${format(date, 'yyyy')}`;
      } else if (selectedAnalyticsPeriod === 'monthly') {
        key = format(date, 'MMM yyyy');
      } else if (selectedAnalyticsPeriod === 'yearly') {
        key = format(date, 'yyyy');
      }
      timeSeriesMap[key] = { completed: 0, revenue: 0 };
    });

    completedAppointments.forEach(appt => {
      const apptDate = parseISO(appt.dateTime);
      const servicePrice = appt.service.price || 0;

      totalCompletedAppointments++;
      totalRevenue += servicePrice;

      // Time Series Data
      let key = '';
      if (selectedAnalyticsPeriod === 'daily') {
        key = format(apptDate, 'MMM dd');
      } else if (selectedAnalyticsPeriod === 'weekly') {
        key = `Week ${format(apptDate, 'w')}, ${format(apptDate, 'yyyy')}`;
      } else if (selectedAnalyticsPeriod === 'monthly') {
        key = format(apptDate, 'MMM yyyy');
      } else if (selectedAnalyticsPeriod === 'yearly') {
        key = format(apptDate, 'yyyy');
      }

      if (!timeSeriesMap[key]) {
        timeSeriesMap[key] = { completed: 0, revenue: 0 };
      }
      timeSeriesMap[key].completed++;
      timeSeriesMap[key].revenue += servicePrice;

      // Service Performance (Profitable Cuts)
      if (appt.service._id) {
        if (!servicePerformanceMap[appt.service._id]) {
          servicePerformanceMap[appt.service._id] = { count: 0, totalRevenue: 0 };
        }
        servicePerformanceMap[appt.service._id].count++;
        servicePerformanceMap[appt.service._id].totalRevenue += servicePrice;
      }

      // Active Barbers
      if (appt.barber._id) {
        activeBarbersMap[appt.barber._id] = (activeBarbersMap[appt.barber._id] || 0) + 1;
      }
    });

    const timeSeriesData = Object.keys(timeSeriesMap)
      .sort((a, b) => {
        // Custom sorting for date-based keys
        if (selectedAnalyticsPeriod === 'daily') {
          // Assuming 'MMM dd' format, need to prepend year for correct parsing
          const currentYear = new Date().getFullYear(); // Or dynamically get the year from existing data
          return parseISO(`${a} ${currentYear}`).getTime() - parseISO(`${b} ${currentYear}`).getTime();
        }
        if (selectedAnalyticsPeriod === 'monthly') {
          // Assuming 'MMM yyyy' format
          return parseISO(`01 ${a}`).getTime() - parseISO(`01 ${b}`).getTime();
        }
        if (selectedAnalyticsPeriod === 'yearly') {
          return parseInt(a) - parseInt(b);
        }
        // Fallback for weekly or other complex sorts
        return a.localeCompare(b);
      })
      .map(key => ({ name: key, ...timeSeriesMap[key] }));


    const servicePerformanceData = Object.keys(servicePerformanceMap)
      .map(serviceId => ({
        name: services.find(s => s._id === serviceId)?.name || 'Unknown Service',
        count: servicePerformanceMap[serviceId].count,
        totalRevenue: servicePerformanceMap[serviceId].totalRevenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by most profitable


    const activeBarbersData = Object.keys(activeBarbersMap)
      .map(barberId => ({
        name: barbers.find(b => b._id === barberId)?.name || 'Unknown Barber',
        value: activeBarbersMap[barberId],
      }))
      .sort((a, b) => b.value - a.value); // Sort by most active

    const averageAppointmentValue = totalCompletedAppointments > 0 ? totalRevenue / totalCompletedAppointments : 0;

    return {
      totalCompletedAppointments,
      totalRevenue,
      averageAppointmentValue,
      timeSeriesData,
      servicePerformanceData, // Renamed from popularServicesData
      activeBarbersData,
    };
  }, [allAppointments, selectedAnalyticsPeriod, barbers, services]);


  if (loading && allAppointments.length === 0) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8} wrap="wrap">
          <Heading as="h1" size="xl" color={textColorPrimary} mb={{ base: 4, md: 0 }}>
            Appointment Management
          </Heading>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Button colorScheme="brand" onClick={() => router.push('/')}>
              View Customer Site
            </Button>
            <Button colorScheme="green" onClick={() => router.push('/admin-reports')}>
              View Reports
            </Button>
            <Button colorScheme="purple" onClick={() => router.push('/barber-dashboard/manage')}>
              Manage Data
            </Button>
          </Stack>
        </Flex>

        <Tabs variant="enclosed" colorScheme="brand" isFitted>
          <TabList>
            <Tab _selected={{ color: textColorPrimary, bg: cardBg, borderColor: borderColor, borderBottomColor: cardBg }}>Today's Appointments</Tab>
            <Tab _selected={{ color: textColorPrimary, bg: cardBg, borderColor: borderColor, borderBottomColor: cardBg }}>Upcoming Appointments</Tab>
            <Tab _selected={{ color: textColorPrimary, bg: cardBg, borderColor: borderColor, borderBottomColor: cardBg }}>Analytics</Tab>
          </TabList>

          <TabPanels p={4} bg={cardBg} borderRadius="md" shadow="md" borderWidth="1px" borderColor={borderColor}>
            {/* Tab 1: Today's Appointments (Bin Structure) */}
            <TabPanel>
              <Text fontSize="xl" color={textColorSecondary} mb={6} textAlign="center">
                Appointments for: <Text as="span" fontWeight="bold" color={textColorPrimary}>{format(new Date(), 'EEEE, MMMM do, yyyy')}</Text>
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                {statusColumns.map(column => (
                  <VStack
                    key={column.id}
                    align="stretch"
                    spacing={4}
                    p={4}
                    bg={cardBg}
                    borderRadius="lg"
                    boxShadow="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    minH="400px"
                  >
                    <Flex justify="space-between" align="center">
                      <Heading as="h2" size="md" color={textColorPrimary}>
                        {column.title}
                      </Heading>
                      <Tag colorScheme={column.colorScheme} size="lg">
                        {todayAppointmentsGroupedByStatus[column.id]?.length || 0}
                      </Tag>
                    </Flex>
                    <Divider borderColor={borderColor} />
                    <VStack align="stretch" spacing={3} overflowY="auto" flex="1">
                      {(todayAppointmentsGroupedByStatus[column.id] && todayAppointmentsGroupedByStatus[column.id].length > 0) ? (
                        todayAppointmentsGroupedByStatus[column.id].map(appt => (
                          <Box
                            key={appt._id}
                            p={3}
                            bg={apptCardBgLight}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={apptCardBorderLight}
                          >
                            <Flex justify="space-between" align="center" mb={1}>
                              <Text fontWeight="semibold" color={textColorPrimary}>
                                {format(parseISO(appt.dateTime), 'hh:mm a')}
                              </Text>
                              <Tag size="sm" colorScheme={column.colorScheme}>
                                {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                              </Tag>
                            </Flex>
                            <Text fontSize="md" color={textColorSecondary}>
                              <Text as="span" fontWeight="medium">{appt.service.name}</Text> for {appt.customer.name}
                            </Text>
                            <Text fontSize="sm" color={textColorSecondary}>
                              Barber: {barbers.find(b => b._id === appt.barber._id)?.name || 'Unknown'}
                            </Text>
                            {appt.notes && (
                              <Text fontSize="sm" fontStyle="italic" color={textColorSecondary} mt={1}>
                                Notes: {appt.notes}
                              </Text>
                            )}
                            <HStack mt={3} justifyContent="flex-end">
                              {/* Confirm Button for Pending appointments */}
                              {appt.status === 'pending' && (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleConfirmAppointment(appt._id)}
                                  isLoading={loading}
                                  isDisabled={loading}
                                >
                                  Confirm
                                </Button>
                              )}
                              {/* Mark Completed/Not Completed Button */}
                              {(appt.status === 'confirmed' || appt.status === 'completed') && (
                                <Button
                                  size="sm"
                                  colorScheme={appt.status === 'completed' ? 'orange' : 'blue'}
                                  onClick={() => handleToggleCompletion(appt._id, appt.status)}
                                  isLoading={loading}
                                  isDisabled={loading}
                                >
                                  {appt.status === 'completed' ? 'Mark Not Completed' : 'Mark Completed'}
                                </Button>
                              )}
                              {/* Cancel Button */}
                              {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                <Button
                                  size="sm"
                                  colorScheme="orange"
                                  onClick={() => handleCancelClick(appt._id)}
                                  isLoading={loading}
                                  isDisabled={loading}
                                >
                                  Cancel
                                </Button>
                              )}
                            </HStack>
                          </Box>
                        ))
                      ) : (
                        <Text color={textColorSecondary} fontStyle="italic" textAlign="center">No appointments.</Text>
                      )}
                    </VStack>
                  </VStack>
                ))}
              </SimpleGrid>
            </TabPanel>

            {/* Tab 2: Upcoming Appointments */}
            <TabPanel>
              <Heading as="h2" size="lg" color={textColorPrimary} mb={4}>
                All Upcoming Appointments
              </Heading>
              {upcomingAppointmentsGrouped.sortedDates.length === 0 ? (
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
                              borderColor={apptCardBorderLight}
                              bg={apptCardBgLight}
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
                                    <Box key={appt._id} borderBottom="1px solid" borderColor={apptCardBorderLight} pb={2}>
                                      <Flex justify="space-between" align="center" mb={1}>
                                        <Text fontWeight="semibold" color={textColorPrimary}>
                                          {format(parseISO(appt.dateTime), 'hh:mm a')}
                                        </Text>
                                        <Tag size="sm" colorScheme={appt.status === 'confirmed' ? 'green' : appt.status === 'pending' ? 'orange' : appt.status === 'completed' ? 'blue' : 'red'}>
                                          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                        </Tag>
                                      </Flex>
                                      <Text fontSize="sm" color={textColorSecondary}>
                                        {appt.service.name} for {appt.customer.name}
                                      </Text>
                                      <HStack mt={2} justifyContent="flex-end">
                                        {/* Confirm Button for Pending appointments */}
                                        {appt.status === 'pending' && (
                                          <Button
                                            size="xs"
                                            colorScheme="green"
                                            onClick={() => handleConfirmAppointment(appt._id)}
                                            isLoading={loading}
                                            isDisabled={loading}
                                          >
                                            Confirm
                                          </Button>
                                        )}
                                        {/* Mark Completed/Not Completed Button */}
                                        {(appt.status === 'confirmed' || appt.status === 'completed') && (
                                          <Button
                                            size="xs"
                                            colorScheme={appt.status === 'completed' ? 'orange' : 'blue'}
                                            onClick={() => handleToggleCompletion(appt._id, appt.status)}
                                            isLoading={loading}
                                            isDisabled={loading}
                                          >
                                            {appt.status === 'completed' ? 'Mark Not Completed' : 'Mark Completed'}
                                          </Button>
                                        )}
                                        {/* Cancel Button */}
                                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                          <Button
                                            size="xs"
                                            colorScheme="orange"
                                            onClick={() => handleCancelClick(appt._id)}
                                            isLoading={loading}
                                            isDisabled={loading}
                                          >
                                            Cancel
                                          </Button>
                                        )}
                                      </HStack>
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
            </TabPanel>

            {/* Tab 3: Analytics */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center" wrap="wrap">
                  <Heading as="h2" size="lg" color={textColorPrimary}>
                    Business Analytics
                  </Heading>
                  <Select
                    value={selectedAnalyticsPeriod}
                    onChange={(e) => setSelectedAnalyticsPeriod(e.target.value as typeof selectedAnalyticsPeriod)}
                    width={{ base: '100%', md: '200px' }}
                    bg={inputBg}
                    borderColor={borderColor}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <StatCard title="Total Completed Appointments" value={analyticsData.totalCompletedAppointments} />
                  <StatCard title="Total Revenue" value={`E${analyticsData.totalRevenue.toFixed(2)}`} />
                  <StatCard title="Avg. Appointment Value" value={`E${analyticsData.averageAppointmentValue.toFixed(2)}`} />
                </SimpleGrid>

                <Divider borderColor={borderColor} />

                {analyticsData.timeSeriesData.length > 0 || analyticsData.servicePerformanceData.length > 0 || analyticsData.activeBarbersData.length > 0 ? (
                  <>
                    {analyticsData.timeSeriesData.length > 0 && (
                      <>
                        <Heading as="h3" size="md" color={textColorPrimary} mt={4}>
                          Completed Appointments & Revenue Over Time ({selectedAnalyticsPeriod.charAt(0).toUpperCase() + selectedAnalyticsPeriod.slice(1)} View)
                        </Heading>
                        <Box height="400px" width="100%">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={analyticsData.timeSeriesData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                              <XAxis dataKey="name" stroke={textColorSecondary} />
                              <YAxis yAxisId="left" orientation="left" stroke={textColorSecondary} label={{ value: 'Appointments', angle: -90, position: 'insideLeft', fill: textColorSecondary }} />
                              <YAxis yAxisId="right" orientation="right" stroke={textColorSecondary} label={{ value: 'Revenue (E)', angle: 90, position: 'insideRight', fill: textColorSecondary }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }}
                                itemStyle={{ color: textColorPrimary }}
                                labelStyle={{ color: textColorSecondary }}
                                formatter={(value: number, name: string) => [`${name === 'revenue' ? 'E' : ''}${value.toFixed(name === 'revenue' ? 2 : 0)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                              />
                              <Legend />
                              <Bar yAxisId="left" dataKey="completed" name="Completed Appointments" fill={COLORS[0]} />
                              <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill={COLORS[1]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </>
                    )}

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                      {analyticsData.servicePerformanceData.length > 0 && (
                        <VStack align="stretch" spacing={4} p={4} bg={cardBg} borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor={borderColor}>
                          <Heading as="h3" size="md" color={textColorPrimary} textAlign="center">
                            Service Performance (Profitable Cuts)
                          </Heading>
                          <Box height="300px" width="100%">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={analyticsData.servicePerformanceData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                layout="vertical"
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                                <XAxis type="number" stroke={textColorSecondary} label={{ value: 'Value', position: 'insideBottom', offset: 0, fill: textColorSecondary }} />
                                <YAxis type="category" dataKey="name" stroke={textColorSecondary} width={100} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }}
                                  itemStyle={{ color: textColorPrimary }}
                                  labelStyle={{ color: textColorSecondary }}
                                  formatter={(value: number, name: string) => {
                                    if (name === 'count') return [`${value} appointments`, 'Completed Count'];
                                    if (name === 'totalRevenue') return [`E${value.toFixed(2)}`, 'Total Revenue'];
                                    return [value, name];
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="count" name="Completed Count" fill={COLORS[3]} />
                                <Bar dataKey="totalRevenue" name="Total Revenue (E)" fill={COLORS[4]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </VStack>
                      )}

                      {analyticsData.activeBarbersData.length > 0 && (
                        <VStack align="stretch" spacing={4} p={4} bg={cardBg} borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor={borderColor}>
                          <Heading as="h3" size="md" color={textColorPrimary} textAlign="center">
                            Most Active Barbers
                          </Heading>
                          <Box height="300px" width="100%">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={analyticsData.activeBarbersData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                                <XAxis type="number" stroke={textColorSecondary} label={{ value: 'Appointments', position: 'insideBottom', offset: 0, fill: textColorSecondary }} />
                                <YAxis type="category" dataKey="name" stroke={textColorSecondary} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }}
                                  itemStyle={{ color: textColorPrimary }}
                                  labelStyle={{ color: textColorSecondary }}
                                  formatter={(value: number, name: string) => [`${value} appointments`, name]}
                                />
                                <Legend />
                                <Bar dataKey="value" name="Appointments" fill={COLORS[2]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </VStack>
                      )}
                    </SimpleGrid>
                  </>
                ) : (
                  <Text color={textColorSecondary} textAlign="center" py={10} fontSize="lg">
                    No completed appointments data available for analytics.
                  </Text>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>


        {/* Universal Cancel Confirmation Dialog */}
        <AlertDialog
          isOpen={isConfirmCancelOpen}
          leastDestructiveRef={cancelRef}
          onClose={onConfirmCancelClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={cardBg} color={textColorPrimary}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Cancel Appointment
              </AlertDialogHeader>

              <AlertDialogBody color={textColorSecondary}>
                Are you sure you want to cancel this appointment? Its status will be changed to 'cancelled'.
              </AlertDialogBody>

              <AlertDialogFooter borderTop="1px solid" borderColor={borderColor}>
                <Button ref={cancelRef} onClick={onConfirmCancelClose} isDisabled={loading}>
                  No, Keep it
                </Button>
                <Button colorScheme="red" onClick={handleCancelAppointment} ml={3} isLoading={loading}>
                  Yes, Cancel It
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
}

// Helper component for displaying statistics
interface StatCardProps {
  title: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColorPrimary = useColorModeValue('gray.800', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack
      p={5}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      align="center"
      justify="center"
      minH="120px"
    >
      <Text fontSize="md" color={textColorSecondary} fontWeight="medium" textAlign="center">
        {title}
      </Text>
      <Heading as="h4" size="lg" color={textColorPrimary} textAlign="center">
        {value}
      </Heading>
    </VStack>
  );
};