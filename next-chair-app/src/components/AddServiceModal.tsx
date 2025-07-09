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
  initialService?: Service | null; // Optional prop for editing existing service
}

export function AddServiceModal({ isOpen, onClose, onServiceSaved, initialService }: AddServiceModalProps) {
  const toast = useToast();
  const [name, setName] = useState(initialService?.name || '');
  const [slug, setSlug] = useState(initialService?.slug?.current || '');
  const [description, setDescription] = useState(initialService?.description || '');
  const [duration, setDuration] = useState(initialService?.duration || 0);
  const [price, setPrice] = useState(initialService?.price || 0);
  const [selectedCategory, setSelectedCategory] = useState(initialService?.category?._id || '');
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>(initialService?.barbers?.map(b => b._id) || []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(initialService?.imageUrl || undefined);

  const [categories, setCategories] = useState<Category[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // State for loading categories/barbers

  // Chakra UI color mode values
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const spinnerColor = useColorModeValue('brand.500', 'brand.200');

  useEffect(() => {
    // Reset form fields when modal is opened or initialService changes
    if (isOpen) {
      setName(initialService?.name || '');
      setSlug(initialService?.slug?.current || '');
      setDescription(initialService?.description || '');
      setDuration(initialService?.duration || 0);
      setPrice(initialService?.price || 0);
      setSelectedCategory(initialService?.category?._id || '');
      setSelectedBarbers(initialService?.barbers?.map(b => b._id) || []);
      setPreviewImageUrl(initialService?.imageUrl || undefined);
      setImageFile(null); // Clear image file on open

      const fetchRelatedData = async () => {
        setDataLoading(true);
        try {
          const [fetchedCategories, fetchedBarbers] = await Promise.all([
            client.fetch(groq`*[_type == "category"]{_id, title}`),
            client.fetch(groq`*[_type == "barber"]{_id, name}`),
          ]);
          setCategories(fetchedCategories);
          setBarbers(fetchedBarbers);
        } catch (error) {
          console.error('Failed to fetch categories or barbers:', error);
          toast({
            title: 'Error loading data.',
            description: 'Could not load categories or barbers. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setDataLoading(false);
        }
      };
      fetchRelatedData();
    }
  }, [isOpen, initialService, toast]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    // Generate slug from name
    setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setImageFile(null);
      setPreviewImageUrl(initialService?.imageUrl || undefined); // Revert to initial if no new file
    }
  };

  const handleBarberSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedBarbers(options);
  };

  const handleSubmit = async () => {
    if (!name || !slug || duration === 0 || price === 0) {
      toast({
        title: 'Missing fields.',
        description: 'Please fill in all required fields (Name, Duration, Price).',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('duration', duration.toString());
      formData.append('price', price.toString());

      if (description) {
        formData.append('description', description);
      }
      if (selectedCategory) {
        formData.append('categoryId', selectedCategory);
      }
      if (selectedBarbers.length > 0) {
        formData.append('barberIds', JSON.stringify(selectedBarbers)); // Stringify array
      }

      if (imageFile) {
        formData.append('image', imageFile); // Append the actual File object
      } else if (initialService && !previewImageUrl && !imageFile) {
        // If it was an existing service, and image was removed, send 'null' to explicitly remove
        formData.append('image', 'null');
      }
      // If initialService.imageUrl exists and no new file, and previewImageUrl is still set,
      // no 'image' field is appended. The server will retain the existing image.

      const endpoint = initialService ? `/api/services?id=${initialService._id}` : '/api/services';
      const method = initialService ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        // IMPORTANT: No 'Content-Type' header needed here; browser sets it automatically for FormData
        body: formData, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save service.');
      }

      toast({
        title: `Service ${initialService ? 'updated' : 'created'}.`,
        description: `Service "${name}" has been successfully ${initialService ? 'updated' : 'created'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onServiceSaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast({
        title: `Error ${initialService ? 'updating' : 'creating'} service.`,
        description: error.message || 'There was an error saving the service. Please try again.',
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
          {initialService ? 'Edit Service' : 'Add New Service'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          {dataLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" color={spinnerColor} />
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl id="name" isRequired>
                  <FormLabel color={labelColor}>Service Name</FormLabel>
                  <Input
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g., Haircut, Beard Trim"
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                </FormControl>

                <FormControl id="duration" isRequired>
                  <FormLabel color={labelColor}>Duration (minutes)</FormLabel>
                  <Input
                    type="number"
                    value={duration === 0 ? '' : duration} // Display empty if 0
                    onChange={(e) => setDuration(Number(e.target.value))}
                    placeholder="e.g., 30, 60"
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl id="price" isRequired>
                <FormLabel color={labelColor}>Price ($)</FormLabel>
                <Input
                  type="number"
                  value={price === 0 ? '' : price} // Display empty if 0
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="e.g., 25.00, 50.00"
                  step="0.01"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="description">
                <FormLabel color={labelColor}>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of the service..."
                  rows={3}
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="category">
                <FormLabel color={labelColor}>Category</FormLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder="Select category (Optional)"
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

              <FormControl id="barbers">
                <FormLabel color={labelColor}>Barbers who perform this service</FormLabel>
                <Select
                  multiple // Enable multiple selection
                  value={selectedBarbers}
                  onChange={handleBarberSelectChange}
                  placeholder="Select barbers (Optional)"
                  bg={inputBg}
                  borderColor={borderColor}
                  height="120px" // Provide enough height for multiple options
                  overflowY="auto"
                >
                  {barbers.map((barber) => (
                    <option key={barber._id} value={barber._id}>
                      {barber.name}
                    </option>
                  ))}
                </Select>
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