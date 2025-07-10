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
      Text, // <--- ADD THIS LINE to import Text
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

      const [name, setName] = useState(initialBarber?.name || '');
      const [bio, setBio] = useState(initialBarber?.bio ? JSON.stringify(initialBarber.bio) : ''); // Store as string for form
      const [imageFile, setImageFile] = useState<File | string | undefined>(initialBarber?.image?.asset?._ref || undefined); // Stores file or existing asset ID
      const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(initialBarber?.imageUrl || undefined); // For image preview
      const [dailyAvailability, setDailyAvailability] = useState<DailyAvailability[]>(initialBarber?.dailyAvailability || [{ _key: Date.now().toString(), dayOfWeek: '', startTime: '', endTime: '' }]);
      const [isLoading, setIsLoading] = useState(false);

      // Color mode values
      const labelColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
      const inputBg = useColorModeValue(theme.colors.neutral.light['bg-input'], theme.colors.neutral.dark['bg-input']);
      const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
      const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);


      useEffect(() => {
        if (isOpen) {
          setName(initialBarber?.name || '');
          setBio(initialBarber?.bio ? JSON.stringify(initialBarber.bio) : '');
          setImageFile(initialBarber?.image?.asset?._ref || undefined);
          setPreviewImageUrl(initialBarber?.imageUrl || undefined);
          setDailyAvailability(initialBarber?.dailyAvailability && initialBarber.dailyAvailability.length > 0
            ? initialBarber.dailyAvailability
            : [{ _key: Date.now().toString(), dayOfWeek: '', startTime: '', endTime: '' }]
          );
        }
      }, [isOpen, initialBarber]);

      const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageFile(file);
          setPreviewImageUrl(URL.createObjectURL(file));
        }
      };

      const addAvailabilityBlock = () => {
        setDailyAvailability([...dailyAvailability, { _key: Date.now().toString(), dayOfWeek: '', startTime: '', endTime: '' }]);
      };

      const removeAvailabilityBlock = (index: number) => {
        setDailyAvailability(dailyAvailability.filter((_, i) => i !== index));
      };

      const handleAvailabilityChange = (index: number, field: keyof DailyAvailability, value: string) => {
        const updatedAvailability = [...dailyAvailability];
        // Ensure _key exists for new blocks before saving
        if (!updatedAvailability[index]._key) {
          updatedAvailability[index]._key = Date.now().toString();
        }
        (updatedAvailability[index] as any)[field] = value; // Type assertion for dynamic field
        setDailyAvailability(updatedAvailability);
      };

      const handleSubmit = async () => {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('name', name);
          formData.append('bio', bio);
          formData.append('dailyAvailability', JSON.stringify(dailyAvailability));

          if (imageFile) {
            // If it's a File object (new upload)
            if (imageFile instanceof File) {
              formData.append('image', imageFile);
            } else if (typeof imageFile === 'string' && imageFile.startsWith('image-')) {
              // If it's an existing Sanity asset ID (string starting with "image-")
              formData.append('existingImageRef', imageFile);
            }
          }

          const method = initialBarber ? 'PUT' : 'POST';
          const url = initialBarber ? `/api/barbers?id=${initialBarber._id}` : '/api/barbers';

          const response = await fetch(url, {
            method: method,
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save barber.');
          }

          toast({
            title: initialBarber ? 'Barber updated.' : 'Barber created.',
            description: `Barber "${name}" has been successfully saved.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          onBarberSaved(); // Refresh list in parent component
          onClose();
        } catch (error: any) {
          toast({
            title: 'Error saving barber.',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          console.error('Error saving barber:', error);
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent bg={cardBg} borderRadius="lg" shadow="xl">
            <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={4}>
              {initialBarber ? 'Edit Barber' : 'Add New Barber'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl id="name" isRequired>
                  <FormLabel color={labelColor}>Barber Name</FormLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                </FormControl>

                <FormControl id="bio">
                  <FormLabel color={labelColor}>Bio (Portable Text JSON)</FormLabel>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={6}
                    placeholder='[{"_key":"abc","children":[{"_key":"def","marks":[],"text":"A short bio about the barber.","...}]}]'
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                  <Text fontSize="sm" color={labelColor} mt={1}>
                    Enter bio as a Sanity Portable Text JSON array.
                  </Text>
                </FormControl>

                <FormControl id="image">
                  <FormLabel color={labelColor}>Barber Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    p={1}
                    onChange={handleImageChange}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                  {previewImageUrl && (
                    <Box mt={3} w="100px" h="100px" position="relative">
                      <Image src={previewImageUrl} alt="Barber Preview" objectFit="cover" borderRadius="md" />
                      <Button
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="-5px"
                        right="-5px"
                        onClick={() => {
                          setImageFile(undefined);
                          setPreviewImageUrl(undefined);
                        }}
                        borderRadius="full"
                      >
                        X
                      </Button>
                    </Box>
                  )}
                </FormControl>

                <FormControl id="dailyAvailability">
                  <FormLabel color={labelColor}>Daily Availability</FormLabel>
                  <VStack spacing={3} align="stretch">
                    {dailyAvailability.map((block, index) => (
                      <Box key={block._key || index} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} position="relative">
                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm" mb={1} color={labelColor}>Day</FormLabel>
                            <Select
                              value={block.dayOfWeek}
                              onChange={(e) => handleAvailabilityChange(index, 'dayOfWeek', e.target.value)}
                              bg={inputBg}
                              borderColor={borderColor}
                            >
                              <option value="">Select Day</option>
                              {daysOfWeek.map(day => (
                                <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm" mb={1} color={labelColor}>Start Time</FormLabel>
                            <Input
                              type="time"
                              value={block.startTime}
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
                              value={block.endTime}
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
    