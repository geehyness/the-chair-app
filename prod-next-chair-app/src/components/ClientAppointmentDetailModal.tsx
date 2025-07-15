// src/components/ClientAppointmentDetailModal.tsx
'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Divider,
  Tag,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';
import { format, parseISO } from 'date-fns';

// Assuming these interfaces are defined in a shared types file or passed down from a parent server component
// For consistency, let's assume they can be imported from the same place as in AdminReportsWrapper.tsx
import type { Customer, Appointment } from '@/app/barber-dashboard/manage/page';
import type { Service, Barber } from '@/app/barber-dashboard/manage/page'; // Ensure Service and Barber types are also available

interface ClientAppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null; // Allow null for initial state or if no customer selected
  appointment: Appointment | null; // Allow null for initial state or if no appointment selected
}

export default function ClientAppointmentDetailModal({
  isOpen,
  onClose,
  customer,
  appointment,
}: ClientAppointmentDetailModalProps) {
  const theme = useTheme();

  const headerBg = useColorModeValue(theme.colors.neutral.light['bg-header'], theme.colors.neutral.dark['bg-header']);
  const headerColor = useColorModeValue(theme.colors.neutral.light['text-header'], theme.colors.neutral.dark['text-header']);
  const modalBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border'], theme.colors.neutral.dark['border']);

  // Determine Tag color based on appointment status
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

  if (!customer || !appointment) {
    return null; // Or render a loading state/message
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={modalBg} color={textColorPrimary} borderRadius="lg" shadow="xl">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} bg={headerBg} color={headerColor} roundedTop="lg">
          Client & Appointment Details
        </ModalHeader>
        <ModalCloseButton color={headerColor} />
        <ModalBody p={6}>
          <VStack align="stretch" spacing={6}>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2} color={textColorPrimary}>Client Information</Text>
              <Divider mb={3} borderColor={borderColor} />
              <HStack spacing={4}>
                <VStack align="start">
                  <Text color={textColorSecondary}>Name:</Text>
                  <Text color={textColorSecondary}>Email:</Text>
                  {customer.phone && <Text color={textColorSecondary}>Phone:</Text>}
                </VStack>
                <VStack align="start">
                  <Text fontWeight="medium" color={textColorPrimary}>{customer.name}</Text>
                  <Text fontWeight="medium" color={textColorPrimary}>{customer.email}</Text>
                  {customer.phone && <Text fontWeight="medium" color={textColorPrimary}>{customer.phone}</Text>}
                </VStack>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2} color={textColorPrimary}>Appointment Details</Text>
              <Divider mb={3} borderColor={borderColor} />
              <VStack align="start" spacing={2}>
                <HStack>
                  <Text color={textColorSecondary}>Service:</Text>
                  <Text fontWeight="medium" color={textColorPrimary}>{appointment.service?.name || 'N/A'}</Text>
                </HStack>
                <HStack>
                  <Text color={textColorSecondary}>Barber:</Text>
                  <Text fontWeight="medium" color={textColorPrimary}>{appointment.barber?.name || 'N/A'}</Text>
                </HStack>
                <HStack>
                  <Text color={textColorSecondary}>Date:</Text>
                  <Text fontWeight="medium" color={textColorPrimary}>
                    {appointment.dateTime ? format(parseISO(appointment.dateTime), 'PPP') : 'N/A'}
                  </Text>
                </HStack>
                <HStack>
                  <Text color={textColorSecondary}>Time:</Text>
                  <Text fontWeight="medium" color={textColorPrimary}>
                    {appointment.dateTime ? format(parseISO(appointment.dateTime), 'p') : 'N/A'}
                  </Text>
                </HStack>
                <HStack>
                  <Text color={textColorSecondary}>Status:</Text>
                  <Tag
                    size="md"
                    variant="solid"
                    colorScheme={getStatusColorScheme(appointment.status)}
                  >
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Tag>
                </HStack>
                {appointment.notes && (
                  <Box>
                    <Text color={textColorSecondary}>Notes:</Text>
                    <Text fontWeight="medium" color={textColorPrimary}>{appointment.notes}</Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}