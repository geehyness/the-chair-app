// src/components/AdminReportsClient.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Select,
  Spinner,
  useToast,
  useDisclosure,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  format,
  parseISO,
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
  isPast,
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
  PieChart, // Added for Pie Chart
  Pie,      // Added for Pie Chart
  Cell,     // Added for Pie Chart
} from 'recharts';

// Import PDF and HTML to Canvas libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import the ClientAppointmentDetailModal
import ClientAppointmentDetailModal from './ClientAppointmentDetailModal';

// Define interfaces for data passed from the server component
interface Appointment {
  _id: string;
  customer: { _id: string; name: string; email: string; phone?: string };
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
  price: number;
}

// Props interface for AdminReportsClient
interface AdminReportsClientProps {
  barbers: Barber[];
  services: Service[];
  allAppointments: Appointment[];
}

// Define a color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];

export default function AdminReportsClient({ barbers, services, allAppointments }: AdminReportsClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  // --- HOOKS: Ensure all hooks are called unconditionally at the top level ---
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [asAtDateTime, setAsAtDateTime] = useState('');

  const reportContentRef = useRef<HTMLDivElement>(null);

  // Color mode values - Defined at the top level of the component
  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const inputBg = useColorModeValue('white', 'gray.700');
  const canvasBackgroundColor = useColorModeValue('#ffffff', '#1A202C');
  const appointmentCardBg = useColorModeValue('gray.50', 'gray.700');

  // State and handlers for the ClientAppointmentDetailModal
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  // --- END HOOKS ---

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    onDetailModalOpen();
  };

  useEffect(() => {
    if (allAppointments && barbers && services) {
      setLoading(false);
      setAsAtDateTime(format(new Date(), 'PPP p'));
    }
  }, [allAppointments, barbers, services]);

  const pastAppointments = useMemo(() => {
    return allAppointments
      .filter(appt => isPast(parseISO(appt.dateTime)))
      .sort((a, b) => parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime());
  }, [allAppointments]);


  // --- Analytics Logic ---
  const analyticsData = useMemo(() => {
    if (loading) {
      return {
        totalCompletedAppointments: 0,
        totalRevenue: 0,
        averageAppointmentValue: 0,
        timeSeriesData: [],
        servicePerformanceData: [],
        activeBarbersData: [],
        appointmentStatusDistributionData: [], // Added for pie chart
      };
    }

    const completedAppointments = allAppointments.filter(appt => appt.status === 'completed');

    let timeSeriesMap: { [key: string]: { completed: number; revenue: number; } } = {};
    let servicePerformanceMap: { [serviceId: string]: { count: number; totalRevenue: number; } } = {};
    let activeBarbersMap: { [barberId: string]: number } = {};
    let appointmentStatusMap: { [status: string]: number } = { // Added for pie chart
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };

    let totalCompletedAppointments = 0;
    let totalRevenue = 0;

    let intervalDates: Date[] = [];
    if (completedAppointments.length > 0) {
      const allApptDates = completedAppointments.map(appt => parseISO(appt.dateTime));
      const minDate = new Date(Math.min(...allApptDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...allApptDates.map(date => date.getTime())));

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

    allAppointments.forEach(appt => { // Iterate all appointments for status distribution
      const apptDate = parseISO(appt.dateTime);
      const servicePrice = appt.service.price || 0;

      // Update status distribution
      if (appointmentStatusMap[appt.status] !== undefined) {
        appointmentStatusMap[appt.status]++;
      }

      // Only count completed appointments for time series, revenue, barbers
      if (appt.status === 'completed') {
        totalCompletedAppointments++;
        totalRevenue += servicePrice;

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

        if (appt.service._id) {
          if (!servicePerformanceMap[appt.service._id]) {
            servicePerformanceMap[appt.service._id] = { count: 0, totalRevenue: 0 };
          }
          servicePerformanceMap[appt.service._id].count++;
          servicePerformanceMap[appt.service._id].totalRevenue += servicePrice;
        }

        if (appt.barber._id) {
          if (!activeBarbersMap[appt.barber._id]) {
            activeBarbersMap[appt.barber._id] = 0;
          }
          activeBarbersMap[appt.barber._id]++;
        }
      }
    });

    const timeSeriesData = Object.keys(timeSeriesMap)
      .sort((a, b) => {
        const getSortableDate = (key: string) => {
          if (selectedAnalyticsPeriod === 'daily') {
            return parseISO(`${key} ${new Date().getFullYear()}`);
          }
          if (selectedAnalyticsPeriod === 'weekly') {
            const [weekStr, yearStr] = key.split(', ');
            const weekNum = parseInt(weekStr.replace('Week ', ''));
            const year = parseInt(yearStr);
            const d = new Date(year, 0, 1 + (weekNum - 1) * 7);
            return d;
          }
          if (selectedAnalyticsPeriod === 'monthly') {
            return parseISO(`01 ${key}`);
          }
          if (selectedAnalyticsPeriod === 'yearly') {
            return new Date(parseInt(key), 0, 1);
          }
          return new Date(key);
        };
        const dateA = getSortableDate(a);
        const dateB = getSortableDate(b);
        return dateA.getTime() - dateB.getTime();
      })
      .map(key => ({ name: key, ...timeSeriesMap[key] }));

    const servicePerformanceData = Object.keys(servicePerformanceMap)
      .map(serviceId => ({
        name: services.find(s => s._id === serviceId)?.name || 'Unknown Service',
        count: servicePerformanceMap[serviceId].count,
        totalRevenue: servicePerformanceMap[serviceId].totalRevenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const activeBarbersData = Object.keys(activeBarbersMap)
      .map(barberId => ({
        name: barbers.find(b => b._id === barberId)?.name || 'Unknown Barber',
        value: activeBarbersMap[barberId],
      }))
      .sort((a, b) => b.value - a.value);

    const appointmentStatusDistributionData = Object.keys(appointmentStatusMap) // Added for pie chart
      .map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: appointmentStatusMap[status],
      }))
      .filter(data => data.value > 0); // Only show statuses that have appointments

    const averageAppointmentValue = totalCompletedAppointments > 0 ? totalRevenue / totalCompletedAppointments : 0;

    return {
      totalCompletedAppointments,
      totalRevenue,
      averageAppointmentValue,
      timeSeriesData,
      servicePerformanceData,
      activeBarbersData,
      appointmentStatusDistributionData, // Added for pie chart
    };
  }, [allAppointments, selectedAnalyticsPeriod, loading, services, barbers]);

  const handleExportCsv = () => {
    setExporting(true);
    toast({
      title: 'Generating CSV...',
      description: 'Your report is being prepared.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    try {
      const { timeSeriesData, servicePerformanceData, activeBarbersData, appointmentStatusDistributionData } = analyticsData;

      let csvContent = "Time Series Data\n";
      csvContent += "Period,Completed Appointments,Total Revenue\n";
      timeSeriesData.forEach(data => {
        csvContent += `${data.name},${data.completed},${data.revenue.toFixed(2)}\n`;
      });

      csvContent += "\nService Performance Data\n";
      csvContent += "Service,Appointments Count,Total Revenue\n";
      servicePerformanceData.forEach(data => {
        csvContent += `${data.name},${data.count},${data.totalRevenue.toFixed(2)}\n`;
      });

      csvContent += "\nActive Barbers Data\n";
      csvContent += "Barber,Appointments Count\n";
      activeBarbersData.forEach(data => {
        csvContent += `${data.name},${data.value}\n`;
      });

      csvContent += "\nAppointment Status Distribution\n"; // Added for pie chart
      csvContent += "Status,Count\n";
      appointmentStatusDistributionData.forEach(data => {
        csvContent += `${data.name},${data.value}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `admin_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: 'Export Successful',
        description: 'Analytics data saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export CSV report.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    toast({
      title: 'Generating PDF...',
      description: 'This may take a moment.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    try {
      if (!reportContentRef.current) {
        toast({
          title: 'Export Failed',
          description: 'Report content not found for PDF export.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      const input = reportContentRef.current;
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: canvasBackgroundColor,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`admin_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);

      toast({
        title: 'PDF Export Successful',
        description: 'Your report has been saved as a PDF.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export PDF report. Try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={bgColor}>
        <Spinner size="xl" color="brand.500" />
        <Text ml={4} fontSize="xl" color={textColorSecondary}>Loading analytics...</Text>
      </Flex>
    );
  }

  const { totalCompletedAppointments, totalRevenue, averageAppointmentValue, timeSeriesData, servicePerformanceData, activeBarbersData, appointmentStatusDistributionData } = analyticsData;

  return (
    <Box minH="100vh" bg={bgColor} fontFamily="body">
      <Container as="main" maxW="6xl" p={8} my={12} bg={cardBg} rounded="lg" shadow="xl">
        <Flex justifyContent="space-between" alignItems="center" mb={6} flexWrap="wrap">
          <Heading as="h1" size="xl" color={textColorPrimary} mb={{ base: 4, md: 0 }}>
            Admin Reports & Analytics
          </Heading>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Button colorScheme="brand" onClick={() => router.push('/barber-dashboard')}>
              Back to Appointments
            </Button>
            <Button colorScheme="purple" onClick={() => router.push('/barber-dashboard/manage')}>
              Manage Data
            </Button>
          </Stack>
        </Flex>

        {/* "As at" Date/Time */}
        <Text fontSize="sm" color={textColorSecondary} textAlign="right" mb={4}>
          As at: {asAtDateTime}
        </Text>

        {/* Export Buttons */}
        <Flex justifyContent="flex-end" mb={6} gap={4}>
          <Button
            leftIcon={<Box as="span" className="fa-solid fa-file-csv" />}
            colorScheme="teal"
            onClick={handleExportCsv}
            isLoading={exporting}
            loadingText="Exporting CSV"
            isDisabled={loading || exporting}
          >
            Export to CSV
          </Button>
          <Button
            leftIcon={<Box as="span" className="fa-solid fa-file-pdf" />}
            colorScheme="red"
            onClick={handleExportPdf}
            isLoading={exporting}
            loadingText="Exporting PDF"
            isDisabled={loading || exporting}
          >
            Export to PDF
          </Button>
        </Flex>

        {/* Main Analytics Content (assign ref here for PDF export) */}
        <VStack spacing={6} align="stretch" p={4} bg={cardBg} borderRadius="md" shadow="md" borderWidth="1px" borderColor={borderColor} ref={reportContentRef}>
          <Flex justify="space-between" align="center" wrap="wrap">
            <Heading as="h2" size="lg" color={textColorPrimary}>
              Business Analytics Overview
            </Heading>
            <Select
              value={selectedAnalyticsPeriod}
              onChange={(e: { target: { value: string; }; }) => setSelectedAnalyticsPeriod(e.target.value as typeof selectedAnalyticsPeriod)}
              width={{ base: '100%', md: '200px' }}
              bg={inputBg}
              borderColor={borderColor}
              color={textColorPrimary}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Flex>

          {totalCompletedAppointments > 0 || allAppointments.length > 0 ? ( // Adjusted condition to also show status distribution if appointments exist
            <>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={4}>
                <StatCard title="Total Completed Appointments" value={totalCompletedAppointments} />
                <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
                <StatCard title="Avg. Appointment Value" value={`$${averageAppointmentValue.toFixed(2)}`} />
              </SimpleGrid>

              {/* Changed columns to always show 2 per line on medium and larger screens */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                {/* Time Series Chart */}
                {timeSeriesData.length > 0 && (
                  <VStack p={4} bg={cardBg} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor} align="stretch">
                    <Text fontSize="xl" fontWeight="semibold" mb={4} color={textColorPrimary}>Appointments & Revenue Over Time</Text>
                    <Box h="300px" w="100%">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                          <XAxis dataKey="name" stroke={textColorSecondary} />
                          <YAxis yAxisId="left" orientation="left" stroke={textColorSecondary} label={{ value: 'Appointments', angle: -90, position: 'insideLeft', fill: textColorSecondary }} />
                          <YAxis yAxisId="right" orientation="right" stroke={textColorSecondary} label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight', fill: textColorSecondary }} />
                          <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }} itemStyle={{ color: textColorPrimary }} labelStyle={{ color: textColorSecondary }} formatter={(value: number, name: string) => {
                            if (name === 'revenue') return `$${value.toFixed(2)}`;
                            return value;
                          }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="completed" name="Completed Appointments" fill={COLORS[0]} />
                          <Bar yAxisId="right" dataKey="revenue" name="Total Revenue" fill={COLORS[1]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </VStack>
                )}

                {/* Service Performance Chart */}
                {servicePerformanceData.length > 0 && (
                  <VStack p={4} bg={cardBg} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor} align="stretch">
                    <Text fontSize="xl" fontWeight="semibold" mb={4} color={textColorPrimary}>Top Services by Revenue</Text>
                    <Box h="300px" w="100%">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={servicePerformanceData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                          <XAxis
                            type="number"
                            stroke={textColorSecondary}
                            label={{ value: 'Revenue ($)', position: 'insideBottom', offset: 0, fill: textColorSecondary }}
                            tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                          />
                          <YAxis type="category" dataKey="name" stroke={textColorSecondary} width={100} />
                          <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }} itemStyle={{ color: textColorPrimary }} labelStyle={{ color: textColorSecondary }} formatter={(value: number, name: string) => {
                            if (name === 'totalRevenue') return [`$${value.toFixed(2)}`, 'Total Revenue'];
                            if (name === 'count') return [value, 'Appointments Count'];
                            return value;
                          }} />
                          <Legend />
                          <Bar dataKey="totalRevenue" name="Total Revenue" fill={COLORS[2]} />
                          <Bar dataKey="count" name="Appointments Count" fill={COLORS[3]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </VStack>
                )}

                {/* Active Barbers Chart */}
                {activeBarbersData.length > 0 && (
                  <VStack p={4} bg={cardBg} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor} align="stretch">
                    <Text fontSize="xl" fontWeight="semibold" mb={4} color={textColorPrimary}>Active Barbers by Appointments</Text>
                    <Box h="300px" w="100%">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeBarbersData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                          <XAxis dataKey="name" stroke={textColorSecondary} />
                          <YAxis type="number" stroke={textColorSecondary} label={{ value: 'Appointments', angle: -90, position: 'insideLeft', fill: textColorSecondary }} />
                          <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }} itemStyle={{ color: textColorPrimary }} labelStyle={{ color: textColorSecondary }} />
                          <Legend />
                          <Bar dataKey="value" name="Appointments" fill={COLORS[2]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </VStack>
                )}

                {/* Appointment Status Distribution Pie Chart */}
                {appointmentStatusDistributionData.length > 0 && (
                  <VStack p={4} bg={cardBg} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor} align="stretch">
                    <Text fontSize="xl" fontWeight="semibold" mb={4} color={textColorPrimary}>Appointment Status Distribution</Text>
                    <Box h="300px" w="100%">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={appointmentStatusDistributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`} // Added nullish coalescing for 'percent'
                          >
                            {appointmentStatusDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: cardBg, borderColor: borderColor }} itemStyle={{ color: textColorPrimary }} labelStyle={{ color: textColorSecondary }} formatter={(value: number, name: string) => [`${value} appointments`, name]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </VStack>
                )}
              </SimpleGrid>
            </>
          ) : (
            <Text color={textColorSecondary} textAlign="center" py={10} fontSize="lg">
              No appointments data available for analytics yet.
            </Text>
          )}

          {/* Past Appointments List displayed using Chakra Table */}
          <Box mt={8}>
            <Heading as="h3" size="md" color={textColorPrimary} mb={4}>
              Past Appointments Overview
            </Heading>
            {pastAppointments.length > 0 ? (
              <TableContainer
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                shadow="sm"
                bg={appointmentCardBg}
              >
                <Table variant="simple" colorScheme="gray">
                  <Thead>
                    <Tr>
                      <Th color={textColorSecondary}>Date & Time</Th>
                      <Th color={textColorSecondary}>Service</Th>
                      <Th color={textColorSecondary}>Barber</Th>
                      <Th color={textColorSecondary}>Client</Th>
                      <Th color={textColorSecondary}>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pastAppointments.map((appt) => (
                      <Tr key={appt._id}>
                        <Td color={textColorPrimary}>
                          {format(parseISO(appt.dateTime), 'PPP p')}
                        </Td>
                        <Td color={textColorPrimary}>
                          {appt.service?.name || 'N/A'}
                        </Td>
                        <Td color={textColorPrimary}>
                          {appt.barber?.name || 'N/A'}
                        </Td>
                        <Td color={textColorPrimary}>
                          {appt.customer?.name || 'N/A'}
                        </Td>
                        <Td>
                          <Tag size="md" colorScheme={getStatusColorScheme(appt.status)}>
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                          </Tag>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Text color={textColorSecondary} textAlign="center" py={5}>
                No past appointments found.
              </Text>
            )}
          </Box>
        </VStack>
      </Container>

      {/* ClientAppointmentDetailModal */}
      <ClientAppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={onDetailModalClose}
        customer={selectedAppointment?.customer || null}
        appointment={selectedAppointment}
      />
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
      <Heading as="h4" size="lg" color={textColorPrimary}>
        {value}
      </Heading>
    </VStack>
  );
};