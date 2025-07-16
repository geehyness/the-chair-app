// src/components/UserManagementModal.tsx
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
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Stack,
  useToast,
  useColorModeValue,
  useTheme,
  Text,
} from '@chakra-ui/react';
import { client } from '@/lib/sanity'; // Still needed for fetching barbers
import { groq } from 'next-sanity';

// Define interfaces for props and data
interface DailyAvailability {
  _key: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Barber {
  _id: string;
  name: string;
  dailyAvailability?: DailyAvailability[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'receptionist' | 'barber';
  barberRef?: { _ref: string; _type: 'reference' };
  // password is not included here for security, it's handled separately
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
  onSaveSuccess: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaveSuccess,
}) => {
  const toast = useToast();
  const theme = useTheme();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'receptionist' | 'barber'>('receptionist');
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Define all color mode values unconditionally at the top level
  const modalBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const textColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const inputBg = useColorModeValue(theme.colors.neutral.light['input-bg'], theme.colors.neutral.dark['input-bg']);
  const inputBorder = useColorModeValue(theme.colors.neutral.light['input-border'], theme.colors.neutral.dark['input-border']);
  const placeholderColor = useColorModeValue(theme.colors.neutral.light['placeholder-color'], theme.colors.neutral.dark['placeholder-color']);
  const labelColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  // Populate form fields when userToEdit changes (for editing)
  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setEmail(userToEdit.email);
      setPhoneNumber(userToEdit.phoneNumber || '');
      setRole(userToEdit.role);
      setSelectedBarber(userToEdit.barberRef?._ref || null);
      setPassword(''); // Clear password field when editing
    } else {
      // Reset form for adding new user
      setUsername('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setRole('receptionist');
      setSelectedBarber(null);
    }
  }, [userToEdit, isOpen]);

  // Fetch barbers when modal opens or component mounts
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const barbersQuery = groq`*[_type == "barber"]{_id, name}`;
        const fetchedBarbers = await client.fetch(barbersQuery);
        setBarbers(fetchedBarbers);
      } catch (error) {
        console.error('Error fetching barbers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load barbers for selection.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    if (isOpen) {
      fetchBarbers();
    }
  }, [isOpen, toast]);

  const handleSubmit = async () => {
    setIsLoading(true);

    if (role === 'barber' && !selectedBarber) {
      toast({
        title: 'Error',
        description: 'Please select an associated barber for a barber user.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    const payload = {
      username,
      email,
      phoneNumber: phoneNumber || undefined,
      password, // Send plaintext password to API route for hashing
      role,
      barberRef: role === 'barber' && selectedBarber ? { _type: 'reference', _ref: selectedBarber } : null,
    };

    try {
      let response;
      if (userToEdit) {
        // Editing existing user
        response = await fetch(`/api/users`, { // PUT request to update
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, _id: userToEdit._id }), // Include _id for update
        });
      } else {
        // Adding new user
        if (!password) {
          toast({
            title: 'Error',
            description: 'Password is required for new users.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }
        response = await fetch('/api/users', { // POST request to create
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save user.');
      }

      toast({
        title: userToEdit ? 'User updated.' : 'User created.',
        description: data.message || `${username} (${email}) has been saved.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSaveSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={modalBg} color={textColor} borderRadius="lg" boxShadow="xl">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          {userToEdit ? 'Edit User' : 'Add New User'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stack spacing={4}>
            <FormControl id="username" isRequired>
              <FormLabel color={labelColor}>Username (Display Name)</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., John Doe"
                bg={inputBg}
                borderColor={inputBorder}
                _placeholder={{ color: placeholderColor }}
              />
            </FormControl>
            <FormControl id="email" isRequired>
              <FormLabel color={labelColor}>Email (Login ID)</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., user@example.com"
                bg={inputBg}
                borderColor={inputBorder}
                _placeholder={{ color: placeholderColor }}
              />
            </FormControl>
            <FormControl id="phoneNumber">
              <FormLabel color={labelColor}>Phone Number</FormLabel>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., +1234567890"
                bg={inputBg}
                borderColor={inputBorder}
                _placeholder={{ color: placeholderColor }}
              />
            </FormControl>
            <FormControl id="password" isRequired={!userToEdit}>
              <FormLabel color={labelColor}>{userToEdit ? 'New Password (Optional)' : 'Password'}</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={userToEdit ? 'Leave blank to keep current' : 'Set initial password'}
                bg={inputBg}
                borderColor={inputBorder}
                _placeholder={{ color: placeholderColor }}
              />
              {userToEdit && (
                <Text fontSize="sm" color={mutedTextColor} mt={1}>
                  Leave blank to keep the current password.
                </Text>
              )}
            </FormControl>
            <FormControl id="role" isRequired>
              <FormLabel color={labelColor}>Role</FormLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'receptionist' | 'barber')}
                bg={inputBg}
                borderColor={inputBorder}
                color={textColor}
              >
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
                <option value="barber">Barber</option>
              </Select>
            </FormControl>
            {role === 'barber' && (
              <FormControl id="associated-barber" isRequired={role === 'barber'}>
                <FormLabel color={labelColor}>Associated Barber</FormLabel>
                <Select
                  placeholder="Select barber"
                  value={selectedBarber || ''}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  color={textColor}
                >
                  {barbers.map((barber) => (
                    <option key={barber._id} value={barber._id}>
                      {barber.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" onClick={onClose} mr={3}>
            Cancel
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit} isLoading={isLoading}>
            {userToEdit ? 'Save Changes' : 'Add User'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserManagementModal;
