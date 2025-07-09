// src/components/AddBlogPostModal.tsx
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
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';
import { urlFor } from '@/lib/sanity'; // Ensure urlFor is imported

// Define interfaces for BlogPost
interface BlogPost {
  _id?: string; // Optional for new posts
  title: string;
  slug: { current: string };
  publishedAt?: string; // ISO string
  excerpt?: string;
  content?: any; // Portable Text array
  coverImageUrl?: string; // URL for display
  coverImage?: any; // Sanity image object for initial value
  author?: string;
  tags?: string[];
}

interface AddBlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlogPostSaved: () => void; // Callback after successful create/update
  initialBlogPost?: BlogPost | null; // Optional prop for editing existing post
}

export function AddBlogPostModal({ isOpen, onClose, onBlogPostSaved, initialBlogPost }: AddBlogPostModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [publishedAt, setPublishedAt] = useState(''); // YYYY-MM-DD for input type="date"
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState(''); // Plain string for textarea, convert to Portable Text JSON
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Chakra UI color mode values
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tagBg = useColorModeValue('green.100', 'green.700');
  const tagColor = useColorModeValue('green.800', 'green.100');

  useEffect(() => {
    // Reset form fields when modal is opened or initialBlogPost changes
    if (isOpen) {
      setTitle(initialBlogPost?.title || '');
      setSlug(initialBlogPost?.slug?.current || '');
      // Format date for input type="date" (YYYY-MM-DD)
      setPublishedAt(initialBlogPost?.publishedAt ? new Date(initialBlogPost.publishedAt).toISOString().split('T')[0] : '');
      setExcerpt(initialBlogPost?.excerpt || '');
      // Convert Portable Text content to a plain string for the textarea
      const contentText = initialBlogPost?.content && Array.isArray(initialBlogPost.content)
        ? initialBlogPost.content.map((block: any) =>
            block.children?.map((child: any) => child.text).join('')
          ).join('\n')
        : '';
      setContent(contentText);
      setAuthor(initialBlogPost?.author || '');
      setTags(initialBlogPost?.tags || []);
      // Set preview image if editing an existing post with an image
      setPreviewCoverImageUrl(initialBlogPost?.coverImageUrl || (initialBlogPost?.coverImage ? urlFor(initialBlogPost.coverImage).url() : undefined));
      setCoverImageFile(null); // Clear image file on open, user re-uploads if needed
      setNewTagInput(''); // Clear new tag input
    }
  }, [isOpen, initialBlogPost]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Generate slug from title
    setSlug(newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      setPreviewCoverImageUrl(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setCoverImageFile(null);
      // If no file selected, revert preview to initial image if available
      setPreviewCoverImageUrl(initialBlogPost?.coverImageUrl || (initialBlogPost?.coverImage ? urlFor(initialBlogPost.coverImage).url() : undefined));
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
      if (publishedAt) {
        formData.append('publishedAt', new Date(publishedAt).toISOString()); // Convert date input to ISO string
      }
      if (excerpt) {
        formData.append('excerpt', excerpt);
      }
      if (author) {
        formData.append('author', author);
      }
      formData.append('tags', JSON.stringify(tags)); // Stringify array

      // Convert plain content string to Sanity Portable Text format
      const processedContent = content.trim() ? [{
        _key: Math.random().toString(36).substring(2, 11),
        _type: 'block',
        children: [{
          _key: Math.random().toString(36).substring(2, 11),
          _type: 'span',
          marks: [],
          text: content.trim(),
        }],
        markDefs: [],
        style: 'normal',
      }] : [];
      formData.append('content', JSON.stringify(processedContent)); // Stringify Portable Text array

      if (coverImageFile) {
        formData.append('coverImage', coverImageFile); // Append the actual File object
      } else if (initialBlogPost && !previewCoverImageUrl && !coverImageFile) {
        // If it was an existing post, and cover image was removed, send 'null' to explicitly remove
        formData.append('coverImage', 'null');
      }
      // If initialBlogPost.coverImageUrl exists and no new file, and previewCoverImageUrl is still set,
      // no 'coverImage' field is appended. The server will retain the existing image.

      const endpoint = initialBlogPost ? `/api/blogPosts?id=${initialBlogPost._id}` : '/api/blogPosts';
      const method = initialBlogPost ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        body: formData, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save blog post.');
      }

      toast({
        title: `Blog post ${initialBlogPost ? 'updated' : 'created'}.`,
        description: `Blog post "${title}" has been successfully ${initialBlogPost ? 'updated' : 'created'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onBlogPostSaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      toast({
        title: `Error ${initialBlogPost ? 'updating' : 'creating'} blog post.`,
        description: error.message || 'There was an error saving the blog post. Please try again.',
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
          {initialBlogPost ? 'Edit Blog Post' : 'Add New Blog Post'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            <FormControl id="title" isRequired>
              <FormLabel color={labelColor}>Title</FormLabel>
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g., 5 Tips for a Perfect Fade"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="slug" isRequired>
              <FormLabel color={labelColor}>Slug</FormLabel>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., 5-tips-perfect-fade"
                bg={inputBg}
                borderColor={borderColor}
                isReadOnly // Slug is auto-generated but can be manually adjusted
              />
            </FormControl>

            <FormControl id="publishedAt">
              <FormLabel color={labelColor}>Published Date (Optional)</FormLabel>
              <Input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="author">
              <FormLabel color={labelColor}>Author (Optional)</FormLabel>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Barber John"
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="excerpt">
              <FormLabel color={labelColor}>Excerpt (Optional)</FormLabel>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary of the blog post..."
                rows={3}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="content">
              <FormLabel color={labelColor}>Content</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post content here..."
                rows={10}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl id="tags">
              <FormLabel color={labelColor}>Tags (e.g., hair, tips, style)</FormLabel>
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

            <FormControl id="coverImage">
              <FormLabel color={labelColor}>Cover Image (Optional)</FormLabel>
              <Input
                type="file"
                accept="image/*"
                p={1}
                onChange={handleCoverImageChange}
                bg={inputBg}
                borderColor={borderColor}
              />
              {previewCoverImageUrl && (
                <Box mt={3} w="150px" h="100px" position="relative">
                  <Image src={previewCoverImageUrl} alt="Cover Image Preview" objectFit="cover" borderRadius="md" />
                  <Button
                    size="xs"
                    colorScheme="red"
                    position="absolute"
                    top="-5px"
                    right="-5px"
                    onClick={() => setPreviewCoverImageUrl(undefined)}
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
            {initialBlogPost ? 'Save Changes' : 'Create Post'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
