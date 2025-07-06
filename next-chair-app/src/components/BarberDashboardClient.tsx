// the-chair-app/components/BarberDashboardClient.tsx
'use client'; // This directive marks this as a Client Component

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Select,
  VStack,
  HStack,
  Tag,
  TagLabel,
  Alert,
  AlertIcon,
  useColorModeValue,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'; // Chakra UI icons

// Define TypeScript interfaces (mirroring the server component for consistency)
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
  customer: Customer;
  barber: Barber;
  service: Service;
  log: LogEntry[];
}

interface BarberDashboardClientProps {
  initialAppointments: Appointment[];
  barberId: string; // The ID of the current barber
}

const BarberDashboardClient: React.FC<BarberDashboardClientProps> = ({ initialAppointments, barberId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [filterDate, setFilterDate] = useState<string>('today'); // 'today', 'upcoming', 'all'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null); // State for expanded log

  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.900', 'gray.100');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const logHeaderColor = useColorModeValue('gray.700', 'gray.200');
  const logTextColor = useColorModeValue('gray.500', 'gray.400');
  const selectBg = useColorModeValue('white', 'gray.700');
  const selectBorder = useColorModeValue('gray.300', 'gray.600');

  // Filter appointments based on selected date filter
  const filteredAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison

    if (filterDate === 'today') {
      return apptDate.toDateString() === today.toDateString();
    } else if (filterDate === 'upcoming') {
      // Include today's appointments and future appointments
      return apptDate.getTime() >= today.getTime();
    }
    return true; // 'all' filter
  });

  // Sort filtered appointments by date and time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });

  /**
   * Handles updating the status of an appointment.
   * Calls the Next.js API route to perform the update in Sanity.
   * @param appointmentId The ID of the appointment to update.
   * @param newStatus The new status for the appointment.
   */
  const handleStatusChange = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    setLoading(true);
    setMessage(null);
    console.info(`Dashboard: Attempting to update appointment status for ${appointmentId} to ${newStatus}`); // Use console.info for client-side

    try {
      const response = await fetch('/api/appointment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, newStatus, barberId }), // Pass barberId for logging context
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update appointment status.');
      }

      const updatedData = await response.json(); // Get the full response including the updated appointment
      const updatedAppointment = updatedData.appointment; // Extract the updated appointment object

      console.info(`Dashboard: Appointment ${appointmentId} status updated to ${newStatus}.`, { appointmentId, newStatus }); // Use console.info for client-side

      // Update the local state to reflect the change immediately
      setAppointments(prev =>
        prev.map(appt =>
          appt._id === appointmentId ? { ...appt, status: updatedAppointment.status, log: updatedAppointment.log } : appt
        )
      );
      setMessage({ type: 'success', text: `Appointment ${updatedAppointment._id.substring(0, 7)}... status updated to ${newStatus}.` });
    } catch (error: any) {
      console.error(`Dashboard: Error updating appointment status for ${appointmentId}:`, { message: error.message, stack: error.stack }); // Use console.error for client-side
      setMessage({ type: 'error', text: error.message || 'An unexpected error occurred during status update.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'confirmed': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box>
      {message && (
        <Alert status={message.type} mb={4} rounded="md">
          <AlertIcon />
          <Text textAlign="center" flex="1">{message.text}</Text>
        </Alert>
      )}

      {/* Filter Controls */}
      <Flex mb={6} justify="flex-start">
        <Select
          id="filterDate"
          p={3}
          border="1px"
          borderColor={selectBorder}
          rounded="md"
          shadow="sm"
          focusBorderColor="brand.400"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          isDisabled={loading}
          bg={selectBg}
        >
          <option value="today">Today's Appointments</option>
          <option value="upcoming">Upcoming Appointments</option>
          <option value="all">All Appointments</option>
        </Select>
      </Flex>

      {loading && (
        <Text textAlign="center" color="brand.600" fontSize="lg" mb={4}>Loading...</Text>
      )}

      {sortedAppointments.length === 0 && !loading ? (
        <Text textAlign="center" color={textColor} fontSize="lg">No appointments found for the selected filter.</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {sortedAppointments.map((appt) => (
            <Box key={appt._id} bg={cardBg} p={6} rounded="xl" shadow="md" border="1px" borderColor={cardBorder}>
              <Flex justify="space-between" alignItems="flex-start" mb={4}>
                <Box>
                  <Heading as="h3" size="lg" color={headingColor} mb={1}>{appt.service.name}</Heading>
                  <Text color={textColor} fontSize="sm">
                    <Text as="span" fontWeight="medium">Customer:</Text> {appt.customer.name} ({appt.customer.email})
                    {appt.customer.phone && ` - ${appt.customer.phone}`}
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    <Text as="span" fontWeight="medium">Time:</Text> {new Date(appt.dateTime).toLocaleString()}
                  </Text>
                  {appt.notes && (
                    <Text color={textColor} fontSize="sm" mt={1}><Text as="span" fontWeight="medium">Notes:</Text> {appt.notes}</Text>
                  )}
                </Box>
                <Tag size="lg" colorScheme={getStatusColor(appt.status)} variant="solid" rounded="full" px={3} py={1}>
                  <TagLabel>{appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</TagLabel>
                </Tag>
              </Flex>

              {/* Status Update Buttons */}
              <Flex wrap="wrap" gap={2} mt={4} pt={4} borderTop="1px" borderColor={cardBorder}>
                {appt.status !== 'confirmed' && appt.status !== 'completed' && (
                  <Button
                    onClick={() => handleStatusChange(appt._id, 'confirmed')}
                    colorScheme="blue"
                    variant="solid"
                    size="sm"
                    isDisabled={loading}
                  >
                    Confirm
                  </Button>
                )}
                {appt.status !== 'completed' && (
                  <Button
                    onClick={() => handleStatusChange(appt._id, 'completed')}
                    colorScheme="green"
                    variant="solid"
                    size="sm"
                    isDisabled={loading}
                  >
                    Mark Completed
                  </Button>
                )}
                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                  <Button
                    onClick={() => handleStatusChange(appt._id, 'cancelled')}
                    colorScheme="red"
                    variant="solid"
                    size="sm"
                    isDisabled={loading}
                  >
                    Cancel
                  </Button>
                )}
              </Flex>

              {/* Activity Log */}
              {appt.log && appt.log.length > 0 && (
                <Box mt={4} pt={4} borderTop="1px" borderColor={cardBorder}>
                  <HStack justify="space-between" align="center">
                    <Heading as="h4" size="sm" color={logHeaderColor}>Activity Log</Heading>
                    <IconButton
                      aria-label={expandedLogId === appt._id ? 'Collapse log' : 'Expand log'}
                      icon={expandedLogId === appt._id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      onClick={() => setExpandedLogId(expandedLogId === appt._id ? null : appt._id)}
                      variant="ghost"
                      size="sm"
                    />
                  </HStack>
                  <Collapse in={expandedLogId === appt._id} animateOpacity>
                    <VStack align="stretch" spacing={1} mt={2}>
                      {appt.log.map((entry, index) => (
                        <Text key={index} fontSize="xs" color={logTextColor}>
                          <Text as="span" fontFamily="mono" color={useColorModeValue('gray.400', 'gray.500')}>{new Date(entry.timestamp).toLocaleString()}:</Text>{' '}
                          <Text as="span" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.300')}>{entry.type.toUpperCase()}:</Text> {entry.message}
                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <Text as="span" ml={2} fontSize="xx-small" color={useColorModeValue('gray.400', 'gray.500')}>
                              ({Object.entries(entry.details).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')})
                            </Text>
                          )}
                        </Text>
                      ))}
                    </VStack>
                  </Collapse>
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default BarberDashboardClient;
