/* eslint-disable react-hooks/rules-of-hooks */
// src/components/BarberMessagesClient.tsx
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  FormControl,
  FormLabel,
  Spinner,
  useToast,
  useDisclosure, // Ensure useDisclosure is imported from Chakra UI
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

import { MessageDetailModal, Contact } from './MessageDetailModal'; // Import Contact interface and MessageDetailModal

interface BarberMessagesClientProps {
  initialContacts: Contact[];
}

export default function BarberMessagesClient({ initialContacts }: BarberMessagesClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Correct usage of useDisclosure hook
  const { isOpen: isMessageModalOpen, onOpen: onMessageModalOpen, onClose: onMessageModalClose } = useDisclosure();

  // Color mode values
  const bgPrimary = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const inputBg = useColorModeValue('white', 'gray.700');

  // Filter contacts based on selected status
  const filteredContacts = useMemo(() => {
    if (filterStatus === 'all') {
      return contacts;
    }
    return contacts.filter(contact => contact.status === filterStatus);
  }, [contacts, filterStatus]);

  const handleViewMessage = (message: Contact) => {
    setSelectedContact(message);
    onMessageModalOpen();
  };

  const handleMessageStatusUpdate = (updatedMessage: Contact) => {
    // Update the contacts state with the new message status
    setContacts((prev) =>
      prev.map((contact) =>
        contact._id === updatedMessage._id ? updatedMessage : contact
      )
    );
  };

  if (loading && contacts.length === 0) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <Box bg={bgPrimary} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8} wrap="wrap">
          <Heading as="h1" size="xl" color={textColorPrimary} mb={{ base: 4, md: 0 }}>
            Customer Messages
          </Heading>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Button colorScheme="brand" onClick={() => router.push('/')}>
              View Customer Site
            </Button>
            <Button colorScheme="green" onClick={() => router.push('/barber-dashboard/admin-reports')}>
              View Reports
            </Button>
            <Button colorScheme="purple" onClick={() => router.push('/barber-dashboard/manage')}>
              Manage Data
            </Button>
            <Button colorScheme="blue" onClick={() => router.push('/barber-dashboard')}>
              Appointments Dashboard
            </Button>
          </Stack>
        </Flex>

        <Box p={4} bg={cardBg} borderRadius="md" shadow="md" borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            <FormControl id="message-filter" width={{ base: '100%', md: '200px' }}>
              <FormLabel color={textColorPrimary}>Filter by Status:</FormLabel>
              <Select
                value={filterStatus}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setFilterStatus(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
                color={textColorPrimary}
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam</option>
              </Select>
            </FormControl>

            {filteredContacts.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple" size="md" borderRadius="lg" overflow="hidden">
                  <Thead bg={useColorModeValue('gray.100', 'gray.600')}>
                    <Tr>
                      <Th color={textColorSecondary}>Sender</Th>
                      <Th color={textColorSecondary}>Subject</Th>
                      <Th color={textColorSecondary}>Sent At</Th>
                      <Th color={textColorSecondary}>Status</Th>
                      <Th color={textColorSecondary}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredContacts.map((msg) => (
                      <Tr key={msg._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                        <Td color={textColorPrimary}>
                          <Text fontWeight="semibold">{msg.name}</Text>
                          <Text fontSize="sm" color={textColorSecondary}>{msg.email}</Text>
                        </Td>
                        <Td color={textColorPrimary}>{msg.subject}</Td>
                        <Td color={textColorPrimary}>{format(parseISO(msg.sentAt), 'MMM dd, yyyy HH:mm')}</Td>
                        <Td>
                          <Tag
                            size="md"
                            variant="solid"
                            borderRadius="full"
                            colorScheme={
                              msg.status === 'new'
                                ? 'orange'
                                : msg.status === 'inProgress'
                                ? 'blue'
                                : msg.status === 'resolved'
                                ? 'green'
                                : 'red'
                            }
                          >
                            {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                          </Tag>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="brand"
                            variant="outline"
                            onClick={() => handleViewMessage(msg)}
                          >
                            View Details
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text color={textColorSecondary} textAlign="center" fontSize="lg" py={10}>
                No customer messages found with the selected filter.
              </Text>
            )}
          </VStack>
        </Box>

        {/* Message Detail Modal */}
        <MessageDetailModal
          isOpen={isMessageModalOpen}
          onClose={onMessageModalClose}
          message={selectedContact}
          onStatusUpdate={handleMessageStatusUpdate}
        />
      </Container>
    </Box>
  );
}
