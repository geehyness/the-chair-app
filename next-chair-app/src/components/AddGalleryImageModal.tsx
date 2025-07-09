// src/components/AddGalleryImageModal.tsx
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
  Checkbox,
  Flex,
  Spinner,
  useColorModeValue,
  useTheme,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
} from '@chakra-ui/react';
import { urlFor } from '@/lib/sanity'; // Ensure urlFor is imported

// Define interfaces for GalleryImage
interface GalleryImage {
  _id?: string; // Optional for new images
  caption?: string;
  tags?: string[];
  featured?: boolean;
  imageUrl?: string; // URL for display, not the Sanity asset object
  image?: any; // Sanity image object for initial value
}

interface AddGalleryImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSaved: () => void; // Callback after successful create/update
  initialImage?: GalleryImage | null; // Optional prop for editing existing image
}

export function AddGalleryImageModal({ isOpen, onClose, onImageSaved, initialImage }: AddGalleryImageModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Chakra UI color mode values
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tagBg = useColorModeValue('blue.100', 'blue.700');
  const tagColor = useColorModeValue('blue.800', 'blue.100');

  useEffect(() => {
    // Reset form fields when modal is opened or initialImage changes
    if (isOpen) {
      setCaption(initialImage?.caption || '');
      setTags(initialImage?.tags || []);
      setFeatured(initialImage?.featured || false);
      // Set preview image if editing an existing image with an image
      setPreviewImageUrl(initialImage?.imageUrl || (initialImage?.image ? urlFor(initialImage.image).url() : undefined));
      setImageFile(null); // Clear image file on open, user re-uploads if needed
      setNewTagInput(''); // Clear new tag input
    }
  }, [isOpen, initialImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setImageFile(null);
      // If no file selected, revert preview to initial image if available
      setPreviewImageUrl(initialImage?.imageUrl || (initialImage?.image ? urlFor(initialImage.image).url() : undefined));
    }
  };

  const handleAddTag = () => {
    const tagToAdd = newTagInput.trim();
    if (tagToAdd && !tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!imageFile && !initialImage) { // Image is required for new entries
      toast({
        title: 'Missing image.',
        description: 'Please select an image for the gallery.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('tags', JSON.stringify(tags)); // Stringify array
      formData.append('featured', String(featured)); // Convert boolean to string

      if (imageFile) {
        formData.append('image', imageFile); // Append the actual File object
      } else if (initialImage && !previewImageUrl && !imageFile) {
        // If it was an existing image, and image was removed, send 'null' to explicitly remove
        formData.append('image', 'null');
      }
      // If initialImage.imageUrl exists and no new file, and previewImageUrl is still set,
      // no 'image' field is appended. The server will retain the existing image.

      const endpoint = initialImage ? `/api/galleryImages?id=${initialImage._id}` : '/api/galleryImages';
      const method = initialImage ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        body: formData, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save gallery image.');
      }

      toast({
        title: `Gallery image ${initialImage ? 'updated' : 'created'}.`,
        description: `Image "${caption || 'Untitled'}" has been successfully ${initialImage ? 'updated' : 'created'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onImageSaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving gallery image:', error);
      toast({
        title: `Error ${initialImage ? 'updating' : 'creating'} gallery image.`,
        description: error.message || 'There was an error saving the gallery image. Please try again.',
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
          {initialImage ? 'Edit Gallery Image' : 'Add New Gallery Image'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <FormControl id="image" isRequired={!initialImage}>
              <FormLabel color={labelColor}>Image File</FormLabel>
              <Input
                type="file"
                accept="image/*"
                p={1}
                onChange={handleImageChange}
                bg={inputBg}
                borderColor={borderColor}
              />
              {previewImageUrl && (
                <Box mt={3} w="150px" h="150px" position="relative">
                  <Image src={previewImageUrl} alt="Image Preview" objectFit="cover" borderRadius="md" />
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

            <FormControl id="caption">
              <FormLabel color={labelColor}>Caption (Optional)</FormLabel>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A short description for the image..."
                rows={2}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="tags">
              <FormLabel color={labelColor}>Tags (e.g., haircut, beard, interior)</FormLabel>
              <HStack wrap="wrap" spacing={2} mb={2}>
                {tags.map((tag, index) => (
                  <Tag key={index} size="md" borderRadius="full" variant="solid" bg={tagBg} color={tagColor}>
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                  </Tag>
                ))}
              </HStack>
              <HStack>
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent form submission
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  bg={inputBg}
                  borderColor={borderColor}
                />
                <Button onClick={handleAddTag} colorScheme="brand">Add</Button>
              </HStack>
            </FormControl>

            <FormControl id="featured">
              <Checkbox
                isChecked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                colorScheme="brand"
                color={labelColor}
              >
                Mark as Featured
              </Checkbox>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            {initialImage ? 'Save Changes' : 'Upload Image'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
