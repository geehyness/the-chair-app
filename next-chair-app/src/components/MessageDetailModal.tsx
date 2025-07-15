// src/components/MessageDetailModal.tsx
'use client'; // Added this directive

import React, { useState } from 'react';
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
  Select,
  FormControl,
  FormLabel,
  Textarea,
  useColorModeValue,
  useTheme,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { format, parseISO } from 'date-fns';
import { client } from '@/lib/sanity'; // Ensure you have a Sanity client for write operations

// Define the Contact interface (can be shared from a types file if available)
export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'new' | 'inProgress' | 'resolved' | 'spam';
  resolutionNotes?: string;
}

interface MessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Contact | null;
  onStatusUpdate: (updatedMessage: Contact) => void; // Callback to update parent state
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({ isOpen, onClose, message, onStatusUpdate }) => {
  const theme = useTheme();
  const toast = useToast();

  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const modalBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const footerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue(theme.colors.neutral.light['bg-input'], theme.colors.neutral.dark['bg-input']);
  const inputBorder = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const placeholderColor = useColorModeValue(theme.colors.neutral.light['text-muted'], theme.colors.neutral.dark['text-muted']);

  const [currentStatus, setCurrentStatus] = useState<'new' | 'inProgress' | 'resolved' | 'spam'>(message?.status || 'new');
  const [resolutionNotes, setResolutionNotes] = useState(message?.resolutionNotes || '');
  const [loading, setLoading] = useState(false);

  // Update local state when message prop changes (e.g., when a new message is selected)
  React.useEffect(() => {
    if (message) {
      setCurrentStatus(message.status);
      setResolutionNotes(message.resolutionNotes || '');
    }
  }, [message]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentStatus(e.target.value as 'new' | 'inProgress' | 'resolved' | 'spam');
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResolutionNotes(e.target.value);
  };

  const handleSave = async () => {
    if (!message) return;

    setLoading(true);
    try {
      const patch = client.patch(message._id);

      // Only set resolutionNotes if status is 'resolved'
      if (currentStatus === 'resolved') {
        patch.set({ status: currentStatus, resolutionNotes: resolutionNotes });
      } else {
        patch.set({ status: currentStatus }).unset(['resolutionNotes']); // Clear notes if not resolved
      }

      const updatedDoc = await patch.commit();

      toast({
        title: 'Message updated.',
        description: `Status changed to ${currentStatus}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Call the callback to update the parent component's state
      onStatusUpdate({ ...message, status: currentStatus, resolutionNotes: currentStatus === 'resolved' ? resolutionNotes : undefined });

      onClose();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: 'Error.',
        description: 'Failed to update message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!message) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="lg" overflow="hidden">
        <ModalHeader borderBottomWidth="1px" borderColor={headerBorderColor} color={textColorPrimary}>
          Message from {message.name}
        </ModalHeader>
        <ModalCloseButton color={textColorPrimary} />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Subject:</Text>
              <Text color={textColorSecondary}>{message.subject}</Text>
            </Box>
            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Message:</Text>
              <Text color={textColorSecondary}>{message.message}</Text>
            </Box>
            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Sender Email:</Text>
              <Text color={textColorSecondary}>{message.email}</Text>
            </Box>
            {message.phone && (
              <Box>
                <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Sender Phone:</Text>
                <Text color={textColorSecondary}>{message.phone}</Text>
              </Box>
            )}
            <Box>
              <Text fontSize="md" fontWeight="bold" color={textColorPrimary}>Sent At:</Text>
              <Text color={textColorSecondary}>{format(parseISO(message.sentAt), 'PPP p')}</Text>
            </Box>
            <FormControl id="message-status">
              <FormLabel color={textColorPrimary}>Status:</FormLabel>
              <Select
                value={currentStatus}
                onChange={handleStatusChange}
                bg={inputBg}
                borderColor={inputBorder}
                color={textColorPrimary}
              >
                <option value="new">New</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam</option>
              </Select>
            </FormControl>
            {currentStatus === 'resolved' && (
              <FormControl id="resolution-notes">
                <FormLabel color={textColorPrimary}>Resolution Notes:</FormLabel>
                <Textarea
                  value={resolutionNotes}
                  onChange={handleNotesChange}
                  placeholder="Add notes about how this message was resolved..."
                  rows={3}
                  bg={inputBg}
                  borderColor={inputBorder}
                  _placeholder={{ color: placeholderColor }}
                  color={textColorPrimary}
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={footerBorderColor}>
          <Button variant="outline" onClick={onClose} mr={3}>
            Close
          </Button>
          <Button colorScheme="brand" onClick={handleSave} isLoading={loading}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
