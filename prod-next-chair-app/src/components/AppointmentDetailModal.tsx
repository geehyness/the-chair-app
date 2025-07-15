// src/components/AppointmentDetailModal.tsx
'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  Box,
  Tag,
  Flex,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';
import { format, parseISO } from 'date-fns';

// Re-using the Appointment interface from BarberDailyAppointmentsClient
interface Appointment {
  _id: string;
  customer: { _id: string; name: string; email?: string; phone?: string; }; // Added email and phone for customer
  barber: { _id: string; name: string };
  service: { _id: string; name: string; duration: number; price: number };
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ isOpen, onClose, appointment }) => {
  const theme = useTheme();

  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const modalBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const footerBorderColor = useColorModeValue('gray.200', 'gray.700');

  if (!appointment) {
    return null; // Don't render if no appointment is provided
  }

  // Determine tag color based on status
  const getStatusColorScheme = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'confirmed':
        return 'green';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="lg" overflow="hidden">
        <ModalHeader borderBottomWidth="1px" borderColor={headerBorderColor} color={textColorPrimary}>
          Appointment Details
        </ModalHeader>
        <ModalCloseButton color={textColorPrimary} />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Date & Time:</Text>
              <Text color={textColorSecondary}>{format(parseISO(appointment.dateTime), 'PPP p')}</Text>
            </Flex>

            <Flex justify="space-between" align="center">
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Status:</Text>
              <Tag size="md" colorScheme={getStatusColorScheme(appointment.status)} borderRadius="full">
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Tag>
            </Flex>

            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Customer:</Text>
              <Text color={textColorSecondary}>{appointment.customer.name}</Text>
              {appointment.customer.email && <Text fontSize="sm" color={textColorSecondary}>{appointment.customer.email}</Text>}
              {appointment.customer.phone && <Text fontSize="sm" color={textColorSecondary}>{appointment.customer.phone}</Text>}
            </Box>

            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Barber:</Text>
              <Text color={textColorSecondary}>{appointment.barber.name}</Text>
            </Box>

            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Service:</Text>
              <Text color={textColorSecondary}>{appointment.service.name}</Text>
              <Text fontSize="sm" color={textColorSecondary}>Duration: {appointment.service.duration} minutes</Text>
              <Text fontSize="sm" color={textColorSecondary}>Price: E{appointment.service.price.toFixed(2)}</Text>
            </Box>

            {appointment.notes && (
              <Box>
                <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Notes:</Text>
                <Text color={textColorSecondary} fontStyle="italic">{appointment.notes}</Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={footerBorderColor}>
          <Button colorScheme="brand" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
