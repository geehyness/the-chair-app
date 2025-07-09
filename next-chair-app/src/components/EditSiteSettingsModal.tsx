// src/components/EditSiteSettingsModal.tsx
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
  HStack,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { client, urlFor } from '@/lib/sanity'; // Ensure client and urlFor are imported
import { groq } from 'next-sanity';

// Define interfaces for SiteSettings
interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettings {
  _id?: string; // Will exist if settings are already created
  title?: string;
  description?: string;
  logoUrl?: string; // URL for display
  logo?: any; // Sanity image object for initial value
  coverImageUrl?: string; // URL for display
  coverImage?: any; // Sanity image object for initial value
  phone?: string;
  email?: string;
  location?: string;
  socialLinks?: SocialLink[];
}

interface EditSiteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void; // Callback after successful update
}

export function EditSiteSettingsModal({ isOpen, onClose, onSettingsSaved }: EditSiteSettingsModalProps) {
  const toast = useToast();
  const theme = useTheme();

  const [settingsId, setSettingsId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | undefined>(undefined);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // State for loading existing settings

  // Chakra UI color mode values
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const labelColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('gray.50', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tagBg = useColorModeValue('purple.100', 'purple.700');
  const tagColor = useColorModeValue('purple.800', 'purple.100');


  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);
      const fetchSettings = async () => {
        try {
          const fetchedSettings: SiteSettings = await client.fetch(groq`*[_type == "siteSettings"][0]{
            _id,
            title,
            description,
            logo, // Fetch Sanity image object
            coverImage, // Fetch Sanity image object
            phone,
            email,
            location,
            socialLinks[]{
              platform,
              url
            }
          }`);

          if (fetchedSettings) {
            setSettingsId(fetchedSettings._id);
            setTitle(fetchedSettings.title || '');
            setDescription(fetchedSettings.description || '');
            setPhone(fetchedSettings.phone || '');
            setEmail(fetchedSettings.email || '');
            setLocation(fetchedSettings.location || '');
            setSocialLinks(fetchedSettings.socialLinks || []);
            setPreviewLogoUrl(fetchedSettings.logo ? urlFor(fetchedSettings.logo).url() : undefined);
            setPreviewCoverImageUrl(fetchedSettings.coverImage ? urlFor(fetchedSettings.coverImage).url() : undefined);
          } else {
            // Reset to default if no settings found
            setSettingsId(undefined);
            setTitle('');
            setDescription('');
            setPhone('');
            setEmail('');
            setLocation('');
            setSocialLinks([]);
            setPreviewLogoUrl(undefined);
            setPreviewCoverImageUrl(undefined);
          }
          setImageFile(null); // Clear image files on open
          setCoverImageFile(null);
          setNewSocialPlatform('');
          setNewSocialUrl('');
        } catch (error) {
          console.error('Failed to fetch site settings:', error);
          toast({
            title: 'Error loading site settings.',
            description: 'Could not load existing site settings. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setDataLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen, toast]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewLogoUrl(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      // If no file selected, revert preview to initial image if available
      setPreviewLogoUrl(settingsId ? (urlFor(client.fetch(groq`*[_id == "${settingsId}"][0]{logo}.logo`)).url()) : undefined);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      setPreviewCoverImageUrl(URL.createObjectURL(file));
    } else {
      setCoverImageFile(null);
      // Revert preview to initial if no new file
      setPreviewCoverImageUrl(settingsId ? (urlFor(client.fetch(groq`*[_id == "${settingsId}"][0]{coverImage}.coverImage`)).url()) : undefined);
    }
  };

  const handleAddSocialLink = () => {
    if (newSocialPlatform && newSocialUrl) {
      setSocialLinks([...socialLinks, { platform: newSocialPlatform, url: newSocialUrl }]);
      setNewSocialPlatform('');
      setNewSocialUrl('');
    } else {
      toast({
        title: 'Missing social link details.',
        description: 'Please provide both platform and URL for the social link.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveSocialLink = (indexToRemove: number) => {
    setSocialLinks(socialLinks.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (title !== undefined) formData.append('title', title);
      if (description !== undefined) formData.append('description', description);
      if (phone !== undefined) formData.append('phone', phone);
      if (email !== undefined) formData.append('email', email);
      if (location !== undefined) formData.append('location', location);
      formData.append('socialLinks', JSON.stringify(socialLinks)); // Stringify array

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (previewLogoUrl === undefined && settingsId) { // If it was an existing setting and logo was removed
        formData.append('logo', 'null');
      }

      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      } else if (previewCoverImageUrl === undefined && settingsId) { // If it was an existing setting and cover image was removed
        formData.append('coverImage', 'null');
      }

      const endpoint = settingsId ? `/api/siteSettings?id=${settingsId}` : '/api/siteSettings';
      const method = settingsId ? 'PUT' : 'POST'; // Use POST for upsert if no ID, PUT for update if ID exists

      const response = await fetch(endpoint, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save site settings.');
      }

      toast({
        title: 'Site settings saved.',
        description: 'Your site settings have been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSettingsSaved(); // Trigger data re-fetch in parent component
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving site settings:', error);
      toast({
        title: 'Error saving site settings.',
        description: error.message || 'There was an error saving the site settings. Please try again.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent bg={modalBg} color={textColor} borderRadius="lg" overflow="hidden">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
          Edit Site Settings
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          {dataLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              <FormControl id="title">
                <FormLabel color={labelColor}>Site Title</FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., The Chair App"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="description">
                <FormLabel color={labelColor}>Tagline / Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description for your website..."
                  rows={3}
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <HStack spacing={4} align="flex-start">
                <FormControl id="logo">
                  <FormLabel color={labelColor}>Logo (Optional)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    p={1}
                    onChange={handleLogoChange}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                  {previewLogoUrl && (
                    <Box mt={3} w="80px" h="80px" position="relative">
                      <Image src={previewLogoUrl} alt="Logo Preview" objectFit="contain" borderRadius="md" />
                      <Button
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="-5px"
                        right="-5px"
                        onClick={() => setPreviewLogoUrl(undefined)}
                        borderRadius="full"
                      >
                        X
                      </Button>
                    </Box>
                  )}
                </FormControl>

                <FormControl id="coverImage">
                  <FormLabel color={labelColor}>Homepage Cover Image (Optional)</FormLabel>
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
              </HStack>

              <FormControl id="phone">
                <FormLabel color={labelColor}>Phone Number</FormLabel>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1234567890"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="email">
                <FormLabel color={labelColor}>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@thechairapp.com"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="location">
                <FormLabel color={labelColor}>Physical Location</FormLabel>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 123 Main St, City, Country"
                  bg={inputBg}
                  borderColor={borderColor}
                />
              </FormControl>

              <FormControl id="socialLinks">
                <FormLabel color={labelColor}>Social Links</FormLabel>
                <VStack align="stretch" spacing={2}>
                  {socialLinks.map((link, index) => (
                    <HStack key={index} borderWidth="1px" borderColor={borderColor} p={2} borderRadius="md" justify="space-between">
                      <Tag size="md" borderRadius="full" variant="solid" bg={tagBg} color={tagColor}>
                        <TagLabel>{link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</TagLabel>
                      </Tag>
                      <Text flex="1" ml={2} fontSize="sm" color={textColor} isTruncated>{link.url}</Text>
                      <Button size="xs" colorScheme="red" onClick={() => handleRemoveSocialLink(index)}>Remove</Button>
                    </HStack>
                  ))}
                  <HStack>
                    <Select
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value)}
                      placeholder="Select Platform"
                      bg={inputBg}
                      borderColor={borderColor}
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="tiktok">TikTok</option>
                    </Select>
                    <Input
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      placeholder="URL"
                      bg={inputBg}
                      borderColor={borderColor}
                    />
                    <Button onClick={handleAddSocialLink} colorScheme="brand">Add</Button>
                  </HStack>
                </VStack>
              </FormControl>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button colorScheme="brand" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            Save Changes
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
