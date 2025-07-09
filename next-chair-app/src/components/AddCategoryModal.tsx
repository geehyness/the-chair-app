// src/components/AddCategoryModal.tsx
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
  Image,
  Flex,
  Spinner,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';
import { urlFor } from '@/lib/sanity'; // Ensure urlFor is imported

// Define interfaces for Category
interface Category {
  _id?: string; // Optional for new categories
  title: string;
  slug: { current: string };
  description?: string;
  imageUrl?: string; // URL for display, not the Sanity asset object
  image?: any; // Sanity image object for initial value
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySaved: () => void; // Callback after successful create/update
  initialCategory?: Category | null; // Optional prop for editing existing category
}

export function AddCategoryModal({ isOpen, onClose, onCategorySaved, initialCategory }: AddCategoryModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Chakra UI color mode values
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Reset form fields when modal is opened or initialCategory changes
    if (isOpen) {
      setTitle(initialCategory?.title || '');
      setSlug(initialCategory?.slug?.current || '');
      setDescription(initialCategory?.description || '');
      // Set preview image if editing an existing category with an image
      setPreviewImageUrl(initialCategory?.imageUrl || (initialCategory?.image ? urlFor(initialCategory.image).url() : undefined));
      setImageFile(null); // Clear image file on open, user re-uploads if needed
    }
  }, [isOpen, initialCategory]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Generate slug from title
    setSlug(newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setImageFile(null);
      // If no file selected, revert preview to initial image if available
      setPreviewImageUrl(initialCategory?.imageUrl || (initialCategory?.image ? urlFor(initialCategory.image).url() : undefined));
    }
  };

  const handleSubmit = async () => {
    if (!title || !slug) {
      toast({
        title: 'Missing fields.',
        description: 'Please fill in required fields (Title, Slug).',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      if (description) {
        formData.append('description', description);
      }

      if (imageFile) {
        formData.append('image', imageFile); // Append the actual File object
      } else if (initialCategory && !previewImageUrl && !imageFile) {
        // If it was an existing category, and image was removed, send 'null' to explicitly remove
        formData.append('image', 'null');
      }
      // If initialCategory.imageUrl exists and no new file, and previewImageUrl is still set,
      // no 'image' field is appended. The server will retain the existing image.

      const endpoint = initialCategory ? `/api/categories?id=${initialCategory._id}` : '/api/categories';
      const method = initialCategory ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        body: formData, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category.');
      }

      toast({
        title: `Category ${initialCategory ? 'updated' : 'created'}.`,
        description: `Category "${title}" has been successfully ${initialCategory ? 'updated' : 'created'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onCategorySaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: `Error ${initialCategory ? 'updating' : 'creating'} category.`,
        description: error.message || 'There was an error saving the category. Please try again.',
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
          {initialCategory ? 'Edit Service Category' : 'Add New Service Category'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <FormControl id="title" isRequired>
              <FormLabel color={labelColor}>Category Title</FormLabel>
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g., Haircuts, Shaves"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="slug" isRequired>
              <FormLabel color={labelColor}>Slug</FormLabel>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., haircuts-shaves"
                bg={inputBg}
                borderColor={borderColor}
                isReadOnly // Slug is auto-generated but can be manually adjusted
              />
            </FormControl>

            <FormControl id="description">
              <FormLabel color={labelColor}>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this category..."
                rows={3}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="image">
              <FormLabel color={labelColor}>Category Image</FormLabel>
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
                  <Image src={previewImageUrl} alt="Category Preview" objectFit="cover" borderRadius="md" />
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
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            {initialCategory ? 'Save Changes' : 'Create Category'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
