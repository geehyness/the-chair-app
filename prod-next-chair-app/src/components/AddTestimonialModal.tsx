// src/components/AddTestimonialModal.tsx
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
  Select,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';
import { urlFor } from '@/lib/sanity'; // Ensure urlFor is imported

// Define interfaces for Testimonial
interface Testimonial {
  _id?: string; // Optional for new testimonials
  customerName: string;
  quote: string;
  rating: number;
  date?: string; // ISO string
  imageUrl?: string; // URL for display, not the Sanity asset object
  image?: any; // Sanity image object for initial value
}

interface AddTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestimonialSaved: () => void; // Callback after successful create/update
  initialTestimonial?: Testimonial | null; // Optional prop for editing existing testimonial
}

export function AddTestimonialModal({ isOpen, onClose, onTestimonialSaved, initialTestimonial }: AddTestimonialModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [customerName, setCustomerName] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(0);
  const [date, setDate] = useState(''); // Stored as YYYY-MM-DD for input type="date"
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
    // Reset form fields when modal is opened or initialTestimonial changes
    if (isOpen) {
      setCustomerName(initialTestimonial?.customerName || '');
      setQuote(initialTestimonial?.quote || '');
      setRating(initialTestimonial?.rating || 0);
      // Format date for input type="date" (YYYY-MM-DD)
      setDate(initialTestimonial?.date ? new Date(initialTestimonial.date).toISOString().split('T')[0] : '');
      // Set preview image if editing an existing testimonial with an image
      setPreviewImageUrl(initialTestimonial?.imageUrl || (initialTestimonial?.image ? urlFor(initialTestimonial.image).url() : undefined));
      setImageFile(null); // Clear image file on open, user re-uploads if needed
    }
  }, [isOpen, initialTestimonial]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setImageFile(null);
      // If no file selected, revert preview to initial image if available
      setPreviewImageUrl(initialTestimonial?.imageUrl || (initialTestimonial?.image ? urlFor(initialTestimonial.image).url() : undefined));
    }
  };

  const handleSubmit = async () => {
    if (!customerName || !quote || rating === 0) {
      toast({
        title: 'Missing fields.',
        description: 'Please fill in required fields (Customer Name, Quote, Rating).',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('customerName', customerName);
      formData.append('quote', quote);
      formData.append('rating', String(rating)); // Convert number to string
      if (date) {
        formData.append('date', new Date(date).toISOString()); // Convert date input to ISO string
      }

      if (imageFile) {
        formData.append('image', imageFile); // Append the actual File object
      } else if (initialTestimonial && !previewImageUrl && !imageFile) {
        // If it was an existing testimonial, and image was removed, send 'null' to explicitly remove
        formData.append('image', 'null');
      }
      // If initialTestimonial.imageUrl exists and no new file, and previewImageUrl is still set,
      // no 'image' field is appended. The server will retain the existing image.

      const endpoint = initialTestimonial ? `/api/testimonials?id=${initialTestimonial._id}` : '/api/testimonials';
      const method = initialTestimonial ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        body: formData, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save testimonial.');
      }

      toast({
        title: `Testimonial ${initialTestimonial ? 'updated' : 'created'}.`,
        description: `Testimonial from "${customerName}" has been successfully ${initialTestimonial ? 'updated' : 'created'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onTestimonialSaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving testimonial:', error);
      toast({
        title: `Error ${initialTestimonial ? 'updating' : 'creating'} testimonial.`,
        description: error.message || 'There was an error saving the testimonial. Please try again.',
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
          {initialTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <FormControl id="customerName" isRequired>
              <FormLabel color={labelColor}>Customer Name</FormLabel>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., John Doe"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="quote" isRequired>
              <FormLabel color={labelColor}>Quote</FormLabel>
              <Textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Enter the customer's testimonial quote here..."
                rows={5}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="rating" isRequired>
              <FormLabel color={labelColor}>Rating (1-5 Stars)</FormLabel>
              <Select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                placeholder="Select rating"
                bg={inputBg}
                borderColor={borderColor}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="date">
              <FormLabel color={labelColor}>Date (Optional)</FormLabel>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="image">
              <FormLabel color={labelColor}>Customer Image (Optional)</FormLabel>
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
                  <Image src={previewImageUrl} alt="Customer Preview" objectFit="cover" borderRadius="full" />
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
            {initialTestimonial ? 'Save Changes' : 'Create Testimonial'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
