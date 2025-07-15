// src/components/AddCustomerModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  useColorModeValue,
  useTheme,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';

// Define interfaces for Customer
interface Customer {
  _id?: string; // Optional for new customers
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints?: number;
  notes?: string;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved: () => void; // Callback after successful create/update
  initialCustomer?: Customer | null; // Optional prop for editing existing customer
}

export function AddCustomerModal({ isOpen, onClose, onCustomerSaved, initialCustomer }: AddCustomerModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Chakra UI color mode values
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Reset form fields when modal is opened or initialCustomer changes
    if (isOpen) {
      setName(initialCustomer?.name || '');
      setEmail(initialCustomer?.email || '');
      setPhone(initialCustomer?.phone || '');
      setLoyaltyPoints(initialCustomer?.loyaltyPoints || 0);
      setNotes(initialCustomer?.notes || '');
    }
  }, [isOpen, initialCustomer]);

  const handleSubmit = async () => {
    if (!name || !email) {
      toast({
        title: 'Missing fields.',
        description: 'Please fill in required fields (Name, Email).',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const customerData = {
        name,
        email,
        phone: phone || undefined, // Send undefined if empty
        loyaltyPoints,
        notes: notes || undefined, // Send undefined if empty
      };

      const endpoint = initialCustomer ? `/api/customers?id=${initialCustomer._id}` : '/api/customers';
      const method = initialCustomer ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save customer.');
      }

      toast({
        title: `Customer ${initialCustomer ? 'updated' : 'created'}.`,
        description: `Customer "${name}" has been successfully ${initialCustomer ? 'updated' : 'created'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onCustomerSaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast({
        title: `Error ${initialCustomer ? 'updating' : 'creating'} customer.`,
        description: error.message || 'There was an error saving the customer. Please try again.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={modalBg} color={textColor} borderRadius="lg" overflow="hidden">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
          {initialCustomer ? 'Edit Customer' : 'Add New Customer'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <FormControl id="name" isRequired>
              <FormLabel color={labelColor}>Customer Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter customer's full name"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="email" isRequired>
              <FormLabel color={labelColor}>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="phone">
              <FormLabel color={labelColor}>Phone Number (Optional)</FormLabel>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +1234567890"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="loyaltyPoints">
              <FormLabel color={labelColor}>Loyalty Points</FormLabel>
              <NumberInput
                min={0}
                value={loyaltyPoints}
                onChange={(_, valueAsNumber) => setLoyaltyPoints(valueAsNumber || 0)}
                bg={inputBg}
                borderColor={borderColor}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl id="notes">
              <FormLabel color={labelColor}>Internal Notes (Optional)</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special preferences or history..."
                rows={3}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            {initialCustomer ? 'Save Changes' : 'Create Customer'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
