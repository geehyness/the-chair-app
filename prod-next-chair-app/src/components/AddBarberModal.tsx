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
  Text,
  Image, // <--- ADD THIS IMPORT
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { client, writeClient } from '@/lib/sanity';
import { urlFor } from '@/lib/sanity'; // Make sure urlFor is imported

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
  bio?: string; // Changed from 'any' (Portable Text array) to 'string' for plain text
  image?: any; // Sanity image object
  dailyAvailability?: DailyAvailability[];
}

interface AddBarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarberSaved: () => void; // Callback after successful create/update
  initialBarber?: Barber | null; // Optional prop for...
}

export function AddBarberModal({ isOpen, onClose, onBarberSaved, initialBarber }: AddBarberModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [bio, setBio] = useState(''); // Initialized as string
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dailyAvailability, setDailyAvailability] = useState<DailyAvailability[]>([{ dayOfWeek: '', startTime: '', endTime: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  // Chakra UI color mode values
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');


  useEffect(() => {
    if (isOpen && initialBarber) {
      setName(initialBarber.name || '');
      setBio(initialBarber.bio || ''); // Directly set bio as string
      if (initialBarber.image) {
        setImagePreviewUrl(urlFor(initialBarber.image).url());
      } else {
        setImagePreviewUrl(null);
      }
      setDailyAvailability(initialBarber.dailyAvailability && initialBarber.dailyAvailability.length > 0
        ? initialBarber.dailyAvailability.map(avail => ({ ...avail })) // Deep copy
        : [{ dayOfWeek: '', startTime: '', endTime: '' }]);
    } else if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setBio('');
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setDailyAvailability([{ dayOfWeek: '', startTime: '', 'endTime': '' }]);
    }
  }, [isOpen, initialBarber]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  const addAvailabilityBlock = () => {
    setDailyAvailability([...dailyAvailability, { dayOfWeek: '', startTime: '', endTime: '' }]);
  };

  const removeAvailabilityBlock = (index: number) => {
    const newAvailability = dailyAvailability.filter((_, i) => i !== index);
    setDailyAvailability(newAvailability);
  };

  const handleAvailabilityChange = (
    index: number,
    field: keyof DailyAvailability,
    value: string
  ) => {
    const newAvailability = [...dailyAvailability];
    (newAvailability[index] as any)[field] = value; // Type assertion for flexibility
    setDailyAvailability(newAvailability);
  };

  const handleSubmit = async () => {
    if (!name) {
      toast({
        title: 'Validation Error',
        description: 'Barber name is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      let coverImageAssetRefId: string | undefined = undefined;
      // Handle image upload if a new image is selected
      if (selectedImage) {
        const uploadedAsset = await writeClient.assets.upload('image', selectedImage);
        coverImageAssetRefId = uploadedAsset._id;
      }

      // Prepare fields for Sanity
      const fields: any = {
        name,
        bio: bio || undefined, // Directly use bio string, or undefined if empty
        dailyAvailability: dailyAvailability.filter(block => block.dayOfWeek && block.startTime && block.endTime)
      };

      if (coverImageAssetRefId) {
        fields.image = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: coverImageAssetRefId,
          },
        };
      } else if (imagePreviewUrl === null && initialBarber?.image) {
        // If image was removed and there was an initial image, explicitly set to null
        fields.image = null;
      }

      if (initialBarber) {
        // Update existing barber
        await writeClient
          .patch(initialBarber._id)
          .set(fields)
          .commit();

        // If old image existed and new one selected or removed, delete old asset
        if (initialBarber.image?._ref && (coverImageAssetRefId || imagePreviewUrl === null)) {
          try {
            await writeClient.delete(initialBarber.image._ref);
            toast({
              title: 'Old image deleted.',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
          } catch (deleteError) {
            console.warn("Failed to delete old image asset:", deleteError);
            toast({
              title: 'Failed to delete old image asset.',
              description: 'It might still be present in Sanity assets.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        }

        toast({
          title: 'Barber updated.',
          description: 'Barber information has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new barber
        const newBarber = {
          _type: 'barber',
          ...fields,
          slug: {
            _type: 'slug',
            current: name.toLowerCase().replace(/\s+/g, '-').slice(0, 96), // Generate slug from name
          },
        };
        await writeClient.create(newBarber);
        toast({
          title: 'Barber created.',
          description: 'New barber has been successfully added.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onBarberSaved(); // Refresh data in parent
      onClose(); // Close modal
    } catch (error) {
      console.error('Failed to save barber:', error);
      toast({
        title: 'Error',
        description: `Failed to save barber: ${(error as Error).message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={cardBg} color={labelColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          {initialBarber ? 'Edit Barber' : 'Add New Barber'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl id="name" isRequired>
              <FormLabel color={labelColor}>Name</FormLabel>
              <Input
                value={name}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setName(e.target.value)}
                placeholder="Barber's Full Name"
                bg={inputBg}
                borderColor={borderColor}
                _placeholder={{ color: placeholderColor }}
              />
            </FormControl>

            <FormControl id="bio">
              <FormLabel color={labelColor}>Bio</FormLabel> {/* Removed Portable Text/JSON from label */}
              <Textarea
                value={bio}
                onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setBio(e.target.value)}
                placeholder='Enter a short biography for the barber.' // Updated placeholder
                rows={5}
                bg={inputBg}
                borderColor={borderColor}
                _placeholder={{ color: placeholderColor }}
              />
              <Text fontSize="sm" color={placeholderColor} mt={1}>
                A brief description or biography of the barber.
              </Text> {/* Updated description */}
            </FormControl>

            <FormControl id="image">
              <FormLabel color={labelColor}>Image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                p={1} // Add some padding for better click area
                bg={inputBg}
                borderColor={borderColor}
              />
              {imagePreviewUrl && (
                <Flex mt={4} align="center">
                  <Image src={imagePreviewUrl} alt="Image Preview" boxSize="100px" objectFit="cover" mr={4} rounded="md" />
                  <Button size="sm" colorScheme="red" onClick={handleRemoveImage}>
                    Remove Image
                  </Button>
                </Flex>
              )}
            </FormControl>

            <FormControl id="dailyAvailability">
              <FormLabel color={labelColor}>Daily Availability</FormLabel>
              <VStack spacing={3} align="stretch">
                {dailyAvailability.map((block, index) => (
                  <Box key={block._key || index} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} position="relative" bg={inputBg}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="sm" color={placeholderColor}>Day of Week</FormLabel>
                        <Select
                          value={block.dayOfWeek}
                          onChange={(e: { target: { value: string; }; }) => handleAvailabilityChange(index, 'dayOfWeek', e.target.value)}
                          bg={inputBg}
                          borderColor={borderColor}
                        >
                          <option value="">Select Day</option>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" color={placeholderColor}>Start Time</FormLabel>
                        <Input
                          type="time"
                          value={block.startTime}
                          onChange={(e: { target: { value: string; }; }) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                          bg={inputBg}
                          borderColor={borderColor}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" color={placeholderColor}>End Time</FormLabel>
                        <Input
                          type="time"
                          value={block.endTime}
                          onChange={(e: { target: { value: string; }; }) => handleAvailabilityChange(index, 'endTime', e.target.value)}
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
