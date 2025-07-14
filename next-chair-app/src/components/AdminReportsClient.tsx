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
} from 'recharts';

// Import PDF and HTML to Canvas libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define interfaces for data passed from the server component
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

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const reportContentRef = useRef<HTMLDivElement>(null);

  // Color mode values - Defined at the top level of the component
  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const inputBg = useColorModeValue('white', 'gray.700');

  // Define the background color for html2canvas here using the hook
  const canvasBackgroundColor = useColorModeValue('#ffffff', '#1A202C');

  useEffect(() => {
    if (allAppointments && barbers && services) {
      setLoading(false);
    }
  }, [allAppointments, barbers, services]);

  // --- Analytics Logic (remains the same) ---
  const analyticsData = useMemo(() => {
    if (loading) {
      return {
        totalCompletedAppointments: 0,
        totalRevenue: 0,
        averageAppointmentValue: 0,
        timeSeriesData: [],
        servicePerformanceData: [],
        activeBarbersData: [],
      };
    }

    const completedAppointments = allAppointments.filter(appt => appt.status === 'completed');

    let timeSeriesMap: { [key: string]: { completed: number; revenue: number; } } = {};
    let servicePerformanceMap: { [serviceId: string]: { count: number; totalRevenue: number; } } = {};
    let activeBarbersMap: { [barberId: string]: number } = {};

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

    completedAppointments.forEach(appt => {
      const apptDate = parseISO(appt.dateTime);
      const servicePrice = appt.service.price || 0;

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
        activeBarbersMap[appt.barber._id] = (activeBarbersMap[appt.barber._id] || 0) + 1;
      }
    });

    const timeSeriesData = Object.keys(timeSeriesMap)
      .sort((a, b) => {
        const getSortableDate = (key: string) => {
          if (selectedAnalyticsPeriod === 'daily') {
            return parseISO(`${key} ${new Date().getFullYear()}`);
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

    const averageAppointmentValue = totalCompletedAppointments > 0 ? totalRevenue / totalCompletedAppointments : 0;

    return {
      totalCompletedAppointments,
      totalRevenue,
      averageAppointmentValue,
      timeSeriesData,
      servicePerformanceData,
      activeBarbersData,
    };
  }, [allAppointments, selectedAnalyticsPeriod, barbers, services, loading]);

  // --- Export Functions ---

  const handleExportCsv = () => {
    setExporting(true);
    try {
      if (analyticsData.timeSeriesData.length === 0 && analyticsData.servicePerformanceData.length === 0 && analyticsData.activeBarbersData.length === 0) {
        toast({
          title: 'No data to export',
          description: 'There is no analytics data available to export.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      let csvContent = '';

      // Add report title and generation date
      csvContent += `"Admin Analytics Report - Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}"\n\n`;

      // 1. Summary Statistics
      csvContent += `"Summary Statistics"\n`;
      csvContent += `"Metric","Value"\n`;
      csvContent += `"Total Completed Appointments",${analyticsData.totalCompletedAppointments}\n`;
      csvContent += `"Total Revenue","E${analyticsData.totalRevenue.toFixed(2)}"\n`;
      csvContent += `"Average Appointment Value","E${analyticsData.averageAppointmentValue.toFixed(2)}"\n\n`;

      // 2. Time Series Data
      if (analyticsData.timeSeriesData.length > 0) {
        csvContent += `"Completed Appointments & Revenue Over Time (${selectedAnalyticsPeriod.charAt(0).toUpperCase() + selectedAnalyticsPeriod.slice(1)} View)"\n`;
        csvContent += `"Period","Completed Appointments","Revenue"\n`;
        analyticsData.timeSeriesData.forEach(row => {
          csvContent += `"${row.name.replace(/"/g, '""')}",${row.completed},${row.revenue.toFixed(2)}\n`;
        });
        csvContent += `\n`;
      }

      // 3. Service Performance Data
      if (analyticsData.servicePerformanceData.length > 0) {
        csvContent += `"Service Performance (Profitable Cuts)"\n`;
        csvContent += `"Service Name","Completed Count","Total Revenue"\n`;
        analyticsData.servicePerformanceData.forEach(row => {
          csvContent += `"${row.name.replace(/"/g, '""')}",${row.count},${row.totalRevenue.toFixed(2)}\n`;
        });
        csvContent += `\n`;
      }

      // 4. Most Active Barbers Data
      if (analyticsData.activeBarbersData.length > 0) {
        csvContent += `"Most Active Barbers"\n`;
        csvContent += `"Barber Name","Appointments Completed"\n`;
        analyticsData.activeBarbersData.forEach(row => {
          csvContent += `"${row.name.replace(/"/g, '""')}",${row.value}\n`;
        });
        csvContent += `\n`;
      }


      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `admin_analytics_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'CSV Exported!',
        description: 'Comprehensive analytics data saved successfully.',
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
        scale: 2, // Increase scale for better resolution
        useCORS: true, // If you have images from external domains
        logging: true, // Enable logging for debugging
        backgroundColor: canvasBackgroundColor, // Use the variable defined at component's top level
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for units, 'a4' for size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Handle multiple pages if content is taller than one A4 page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`admin_analytics_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);

      toast({
        title: 'PDF Exported!',
        description: 'Analytics report saved as PDF.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: `Could not export PDF report. Error: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };


  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color="brand.500" />
        <Text ml={4} fontSize="xl" color={textColorSecondary}>Loading analytics data...</Text>
      </Flex>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8} wrap="wrap">
          <Heading as="h1" size="xl" color={textColorPrimary} mb={{ base: 4, md: 0 }}>
            Admin Reports
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
        <VStack
          spacing={6}
          align="stretch"
          p={4}
          bg={cardBg}
          borderRadius="md"
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          ref={reportContentRef}
        >
          <Flex justify="space-between" align="center" wrap="wrap">
            <Heading as="h2" size="lg" color={textColorPrimary}>
              Business Analytics Overview
            </Heading>
            <Select
              value={selectedAnalyticsPeriod}
              onChange={(e) => setSelectedAnalyticsPeriod(e.target.value as typeof selectedAnalyticsPeriod)}
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
                  <Heading as="h3" size="md" color={textColorPrimary} mt={4} textAlign="center">
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
              No completed appointments data available for analytics yet.
            </Text>
          )}
        </VStack>
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