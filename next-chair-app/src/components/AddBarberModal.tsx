// src/components/AddBarberModal.tsx
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
  Box,
  SimpleGrid,
  Checkbox,
  Flex,
  IconButton,
  useColorModeValue,
  Select,
  useTheme,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { client, writeClient } from '@/lib/sanity'; // Ensure your Sanity client is imported

// Update DailyAvailability interface to include _key for existing blocks
interface DailyAvailability {
  _key?: string; // Add _key for Sanity array items when editing
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

// Define Barber interface for initialBarber prop
interface Barber {
  _id: string;
  name: string;
  bio?: any; // Portable Text array
  image?: any; // Sanity image object
  dailyAvailability?: DailyAvailability[];
}

interface AddBarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarberSaved: () => void; // Callback after successful create/update
  initialBarber?: Barber | null; // Optional prop for editing existing barber
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function AddBarberModal({ isOpen, onClose, onBarberSaved, initialBarber }: AddBarberModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [bio, setBio] = useState(''); // Bio as plain string for textarea
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dailyAvailability, setDailyAvailability] = useState<DailyAvailability[]>([
    { dayOfWeek: 'monday', startTime: '', endTime: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Colors for dark/light mode
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const modalBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);

  // Effect to pre-fill form when modal opens for editing, or reset for new barber
  useEffect(() => {
    if (isOpen) {
      setError(''); // Clear any previous errors

      if (initialBarber) {
        // Populate fields for editing
        setName(initialBarber.name || '');
        // Convert Portable Text bio to a plain string for the textarea
        const bioText = initialBarber.bio && Array.isArray(initialBarber.bio)
          ? initialBarber.bio.map((block: any) =>
              block.children?.map((child: any) => child.text).join('')
            ).join('\n')
          : '';
        setBio(bioText);
        // Do not pre-fill image input for security reasons, user re-uploads if needed
        setImageFile(null);
        setDailyAvailability(initialBarber.dailyAvailability && initialBarber.dailyAvailability.length > 0
          ? initialBarber.dailyAvailability
          : [{ dayOfWeek: 'monday', startTime: '', endTime: '' }]);
      } else {
        // Reset fields for creating a new barber
        setName('');
        setBio('');
        setImageFile(null);
        setDailyAvailability([{ dayOfWeek: 'monday', startTime: '', endTime: '' }]);
      }
    }
  }, [isOpen, initialBarber]);

  const handleAvailabilityChange = (index: number, field: keyof DailyAvailability, value: string) => {
    const updatedAvailability = dailyAvailability.map((block, i) =>
      i === index ? { ...block, [field]: value } : block
    );
    setDailyAvailability(updatedAvailability);
  };

  const addAvailabilityBlock = () => {
    setDailyAvailability([...dailyAvailability, { dayOfWeek: 'monday', startTime: '', endTime: '' }]);
  };

  const removeAvailabilityBlock = (index: number) => {
    setDailyAvailability(dailyAvailability.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    if (!name.trim()) {
      setError('Barber name is required.');
      setIsLoading(false);
      return;
    }

    // Convert plain bio string back to Sanity Portable Text format
    const processedBio = bio.trim() ? [{
      _key: Math.random().toString(36).substring(2, 11), // Generate a unique key for the block
      _type: 'block',
      children: [{
        _key: Math.random().toString(36).substring(2, 11), // Unique key for child
        _type: 'span',
        marks: [],
        text: bio.trim(),
      }],
      markDefs: [],
      style: 'normal',
    }] : [];

    try {
      let barberDoc: any = {
        _type: 'barber',
        name,
        slug: {
          _type: 'slug',
          current: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        },
        bio: processedBio,
        dailyAvailability: dailyAvailability.map(block => ({
          _key: block._key || Math.random().toString(36).substring(2, 11), // Ensure _key for new blocks
          _type: 'timeBlock', // Ensure this matches your schema's type name for array objects
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
        })),
      };

      let result;
      if (initialBarber) {
        // Update existing barber
        let patch = writeClient.patch(initialBarber._id);

        // Update name, bio, and availability
        patch = patch.set({
          name: barberDoc.name,
          slug: barberDoc.slug,
          bio: barberDoc.bio,
          dailyAvailability: barberDoc.dailyAvailability,
        });

        // Handle image update: if new file, upload and set. If no new file, keep existing image reference.
        if (imageFile) {
          const asset = await writeClient.assets.upload('image', imageFile);
          patch = patch.set({
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: asset._id,
              },
            },
          });
        } else if (initialBarber.image) {
            // If no new image and initial barber had an image, ensure it's retained.
            // No action needed here as it's already part of the initial patch target
            // unless we specifically want to remove it. If user wants to remove, they need a "clear image" button.
            // For now, if imageFile is null, the existing image (if any) is kept.
        } else {
            // If no new image and no initial image, ensure image field is null
            patch = patch.set({ image: null });
        }

        result = await patch.commit();
        toast({
          title: 'Barber updated.',
          description: `${name} has been successfully updated.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

      } else {
        // Create new barber
        if (imageFile) {
          const asset = await writeClient.assets.upload('image', imageFile);
          barberDoc.image = {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          };
        }

        result = await writeClient.create(barberDoc);
        toast({
          title: 'Barber created.',
          description: `${name} has been successfully added.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }

      onBarberSaved(); // Trigger data re-fetch on dashboard
      onClose();
    } catch (err: any) {
      console.error('Failed to save barber:', err);
      setError(`Failed to save barber: ${err.message || 'Unknown error'}`);
      toast({
        title: 'Error saving barber.',
        description: err.message || 'An error occurred while saving the barber.',
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
      <ModalContent bg={modalBg} color={labelColor}>
        <ModalHeader>{initialBarber ? 'Edit Barber' : 'Add New Barber'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {error && (
            <Box mb={4} color="red.500" fontSize="sm">
              {error}
            </Box>
          )}
          <VStack spacing={4}>
            <FormControl id="name" isRequired>
              <FormLabel color={labelColor}>Barber Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter barber's name"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="bio">
              <FormLabel color={labelColor}>Bio</FormLabel>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short description of the barber..."
                rows={4}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="image">
              <FormLabel color={labelColor}>Profile Image</FormLabel>
              <Input
                type="file"
                p={1}
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                bg={inputBg}
                borderColor={borderColor}
              />
               {initialBarber?.image && !imageFile && (
                  <Text fontSize="sm" mt={1} color={labelColor}>
                    Current image will be kept unless a new one is selected.
                  </Text>
              )}
            </FormControl>

            <FormControl id="dailyAvailability">
              <FormLabel color={labelColor}>Daily Availability</FormLabel>
              <VStack spacing={3} align="stretch" p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                {dailyAvailability.map((avail, index) => (
                  <Box key={avail._key || index} position="relative" p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="sm" mb={1} color={labelColor}>Day</FormLabel>
                        <Select
                          value={avail.dayOfWeek}
                          onChange={(e) => handleAvailabilityChange(index, 'dayOfWeek', e.target.value)}
                          bg={inputBg}
                          borderColor={borderColor}
                        >
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" mb={1} color={labelColor}>Start Time</FormLabel>
                        <Input
                          type="time"
                          value={avail.startTime}
                          onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                          placeholder="HH:mm"
                          bg={inputBg}
                          borderColor={borderColor}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" mb={1} color={labelColor}>End Time</FormLabel>
                        <Input
                          type="time"
                          value={avail.endTime}
                          onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                          placeholder="HH:mm"
                          bg={inputBg}
                          borderColor={borderColor}
                        />
                      </FormControl>
                    </SimpleGrid>
                    {dailyAvailability.length > 1 && (
                      <IconButton
                        aria-label="Remove availability block"
                        icon={<MinusIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => removeAvailabilityBlock(index)}
                        position="absolute"
                        top="2"
                        right="2"
                      />
                    )}
                  </Box>
                ))}
                <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={addAvailabilityBlock}>
                  Add Another Block
                </Button>
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            {initialBarber ? 'Save Changes' : 'Create Barber'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}