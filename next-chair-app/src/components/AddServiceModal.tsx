// src/components/AddServiceModal.tsx
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
  Select,
  useColorModeValue,
  Spinner,
  Image,
  Flex,
  CheckboxGroup, // Import CheckboxGroup for multiple checkbox selection
  Checkbox,      // Import Checkbox for individual checkboxes
  Stack,         // Import Stack for layout of checkboxes
} from '@chakra-ui/react';
import { client, urlFor, writeClient } from '@/lib/sanity'; // Ensure your Sanity client is imported
import { groq } from 'next-sanity';

// Define interfaces for Service, Category, and Barber to be used in the modal
interface Service {
  _id?: string; // Optional for new services
  name: string;
  slug: { current: string };
  description?: string;
  imageUrl?: string; // URL for display, not the Sanity asset object
  duration: number;
  price: number;
  category?: { _id: string; title: string }; // Expanded category
  barbers?: Array<{ _id: string; name: string }>; // Expanded barbers
  image?: { asset: { _ref: string } }; // Added the 'image' property
}

interface Category {
  _id: string;
  title: string;
}

interface Barber {
  _id: string;
  name: string;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceSaved: () => void; // Callback after successful create/update
  initialService?: Service | null;
  categories: Category[]; // Add this line
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onServiceSaved,
  initialService,
  categories, // Destructure categories here
}) => {
  const [name, setName] = useState(initialService?.name || '');
  const [description, setDescription] = useState(initialService?.description || '');
  const [duration, setDuration] = useState(initialService?.duration || 30);
  const [price, setPrice] = useState(initialService?.price || 0);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialService?.category?._id);
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>(initialService?.barbers?.map(b => b._id) || []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(initialService?.imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]); // State to hold barbers
  const toast = useToast();

  // Chakra UI color mode hooks
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('white', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Fetch barbers when the modal opens or categories change
    if (isOpen) {
      const fetchBarbers = async () => {
        try {
          const query = groq`*[_type == "barber"]{_id, name}`;
          const fetchedBarbers = await client.fetch(query);
          setBarbers(fetchedBarbers);
        } catch (error) {
          console.error('Error fetching barbers:', error);
          toast({
            title: 'Error fetching barbers',
            description: 'Could not load barbers for selection.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      fetchBarbers();
    }
  }, [isOpen, toast]);

  // Effect to update form fields when initialService changes (for editing)
  useEffect(() => {
    if (initialService) {
      setName(initialService.name);
      setDescription(initialService.description || '');
      setDuration(initialService.duration);
      setPrice(initialService.price);
      setSelectedCategory(initialService.category?._id);
      setSelectedBarbers(initialService.barbers?.map(b => b._id) || []);
      setPreviewImageUrl(initialService.imageUrl);
      setImageFile(null); // Clear image file when setting initialService
    } else {
      // Reset form for new service if no initialService
      setName('');
      setDescription('');
      setDuration(30);
      setPrice(0);
      setSelectedCategory(undefined);
      setSelectedBarbers([]);
      setPreviewImageUrl(undefined);
      setImageFile(null);
    }
  }, [initialService]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setImageFile(null);
      setPreviewImageUrl(undefined);
    }
  };

  // New handler for checkbox group change
  const handleBarberChange = (value: string[]) => {
    setSelectedBarbers(value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    let uploadedAssetRef = initialService?.image?.asset?._ref; // Keep existing asset ref for updates

    try {
      // 1. Handle image upload if a new file is selected
      if (imageFile) {
        const uploadedAsset = await writeClient.assets.upload('image', imageFile);
        uploadedAssetRef = uploadedAsset._id;
      }

      // Prepare barber references
      const barberReferences = selectedBarbers.map(barberId => ({
        _ref: barberId,
        _type: 'reference',
      }));

      // Prepare the service document
      const serviceDoc = {
        _type: 'service',
        name,
        slug: {
          _type: 'slug',
          current: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        },
        description,
        duration,
        price,
        ...(selectedCategory && { category: { _ref: selectedCategory, _type: 'reference' } }),
        ...(barberReferences.length > 0 && { barbers: barberReferences }),
        ...(uploadedAssetRef && {
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: uploadedAssetRef,
            },
          },
        }),
      };

      if (initialService?._id) {
        // Update existing service
        await writeClient
          .patch(initialService._id)
          .set(serviceDoc)
          .commit();
        toast({
          title: 'Service updated.',
          description: `Service "${name}" has been updated.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create new service
        await writeClient.create(serviceDoc);
        toast({
          title: 'Service created.',
          description: `Service "${name}" has been added.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }

      onServiceSaved(); // Trigger refresh in parent component
      onClose(); // Close the modal
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Error saving service',
        description: 'There was an error saving the service. Please try again.',
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
      <ModalContent bg={modalBg} color={textColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          {initialService ? 'Edit Service' : 'Add New Service'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading && !initialService ? ( // Show spinner only on initial load for new service
            <Flex justify="center" align="center" minH="200px">
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch" py={4}>
              <FormControl id="name" isRequired>
                <FormLabel color={labelColor}>Service Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Haircut, Beard Trim"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="description">
                <FormLabel color={labelColor}>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the service"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl id="duration" isRequired>
                  <FormLabel color={labelColor}>Duration (minutes)</FormLabel>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    min={0}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                </FormControl>

                <FormControl id="price" isRequired>
                  <FormLabel color={labelColor}>Price</FormLabel>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min={0}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl id="category">
                <FormLabel color={labelColor}>Category</FormLabel>
                <Select
                  placeholder="Select category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Replaced Select with CheckboxGroup for barbers */}
              <FormControl id="barbers">
                <FormLabel color={labelColor}>Available Barbers</FormLabel>
                <CheckboxGroup value={selectedBarbers} onChange={handleBarberChange}>
                  <Stack spacing={2} direction="column"> {/* Stack for vertical arrangement of checkboxes */}
                    {barbers.map((barber) => (
                      <Checkbox key={barber._id} value={barber._id}>
                        {barber.name}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl id="image">
                <FormLabel color={labelColor}>Service Image</FormLabel>
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
                    <Image src={previewImageUrl} alt="Service Preview" objectFit="cover" borderRadius="md" />
                    <Button
                      size="xs"
                      colorScheme="red"
                      position="absolute"
                      top="-5px"
                      right="-5px"
                      onClick={() => setPreviewImageUrl(undefined)}
                      borderRadius="full"
                    >
                      X
                    </Button>
                  </Box>
                )}
              </FormControl>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            {initialService ? 'Save Changes' : 'Create Service'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}