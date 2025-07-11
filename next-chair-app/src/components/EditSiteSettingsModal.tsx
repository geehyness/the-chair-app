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
  Text,
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // State for image handling
  const [logoFile, setLogoFile] = useState<File | null>(null); // State for the selected logo file
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | undefined>(undefined); // URL for logo preview
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null); // State for the selected cover image file
  const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState<string | undefined>(undefined); // URL for cover image preview

  const [isLoading, setIsLoading] = useState(false);
  const [showImageSpinners, setShowImageSpinners] = useState(false);

  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const labelColor = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const inputBg = useColorModeValue(theme.colors.neutral.light['bg-input'], theme.colors.neutral.dark['bg-input']);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const tagBg = useColorModeValue(theme.colors.brand['100'], theme.colors.brand['700']);
  const tagColor = useColorModeValue(theme.colors.brand['800'], 'whiteAlpha.900');


  useEffect(() => {
    if (isOpen) {
      // Fetch current settings when modal opens
      setIsLoading(true);
      client.fetch(groq`*[_type == "siteSettings"][0]{
        title,
        description,
        phone,
        email,
        location,
        "logoUrl": logo.asset->url, // Fetch direct URL
        "coverImageUrl": coverImage.asset->url, // Fetch direct URL
        socialLinks
      }`).then((data: SiteSettings) => {
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
          setLocation(data.location || '');
          setSocialLinks(data.socialLinks || []);
          setPreviewLogoUrl(data.logoUrl); // Set preview URL
          setPreviewCoverImageUrl(data.coverImageUrl); // Set preview URL
        }
      }).catch((error) => {
        console.error('Failed to fetch site settings:', error);
        toast({
          title: 'Error fetching settings',
          description: 'Could not load site settings.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }).finally(() => {
        setIsLoading(false);
      });

      // Clear file inputs and new social link fields on open
      setLogoFile(null); // Corrected from setImageFile
      setCoverImageFile(null);
      setNewSocialPlatform('');
      setNewSocialUrl('');
    }
  }, [isOpen, toast]);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
      setPreviewLogoUrl(URL.createObjectURL(file)); // Create a URL for immediate preview
    } else {
      setLogoFile(null);
      setPreviewLogoUrl(undefined);
    }
  };

  const handleCoverImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCoverImageFile(file);
      setPreviewCoverImageUrl(URL.createObjectURL(file)); // Create a URL for immediate preview
    } else {
      setCoverImageFile(null);
      setPreviewCoverImageUrl(undefined);
    }
  };

  const handleAddSocialLink = () => {
    if (newSocialPlatform && newSocialUrl) {
      setSocialLinks([...socialLinks, { platform: newSocialPlatform, url: newSocialUrl }]);
      setNewSocialPlatform('');
      setNewSocialUrl('');
    } else {
      toast({
        title: 'Missing fields',
        description: 'Please enter both platform and URL for the social link.',
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
    setShowImageSpinners(true); // Show spinners when starting upload/save

    try {
      let logoAssetRef = undefined;
      let coverImageAssetRef = undefined;

      // Upload new logo if a file is selected
      if (logoFile) {
        const logoAsset = await client.assets.upload('image', logoFile);
        logoAssetRef = {
          _type: 'image',
          asset: {
            _ref: logoAsset._id,
            _type: 'reference',
          },
        };
      }

      // Upload new cover image if a file is selected
      if (coverImageFile) {
        const coverImageAsset = await client.assets.upload('image', coverImageFile);
        coverImageAssetRef = {
          _type: 'image',
          asset: {
            _ref: coverImageAsset._id,
            _type: 'reference',
          },
        };
      }

      // Construct the patch document
      const patchDoc: SiteSettings = {
        title,
        description,
        phone,
        email,
        location,
        socialLinks,
      };

      // Conditionally add image assets to the patch document
      if (logoAssetRef !== undefined) {
        patchDoc.logo = logoAssetRef;
      }
      if (coverImageAssetRef !== undefined) {
        patchDoc.coverImage = coverImageAssetRef;
      }

      // If no logo file was selected but there was a preview URL (meaning existing image),
      // and the user cleared it, explicitly set logo to null to remove it from Sanity.
      if (!logoFile && previewLogoUrl === undefined) {
        (patchDoc as any).logo = null;
      }
      // Same for cover image
      if (!coverImageFile && previewCoverImageUrl === undefined) {
        (patchDoc as any).coverImage = null;
      }


      // Check if siteSettings document exists
      const existingSettings = await client.fetch(groq`*[_type == "siteSettings"][0]{_id}`);
      let siteSettingsId = existingSettings ? existingSettings._id : null;

      if (siteSettingsId) {
        // Update existing document
        await client.patch(siteSettingsId).set(patchDoc).commit();
      } else {
        // Create new document if it doesn't exist
        const newSettings = { _type: 'siteSettings', ...patchDoc };
        const createdDoc = await client.create(newSettings);
        siteSettingsId = createdDoc._id; // Get the ID of the newly created document
      }

      toast({
        title: 'Settings saved.',
        description: 'Site settings have been updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onSettingsSaved(); // Callback to refresh data in parent
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error('Failed to save site settings:', error);
      toast({
        title: 'Error saving settings.',
        description: `Failed to update site settings: ${error.message || 'Unknown error'}`,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setShowImageSpinners(false); // Hide spinners after upload/save attempt
    }
  };

  const handleClearLogo = () => {
    setLogoFile(null);
    setPreviewLogoUrl(undefined);
  };

  const handleClearCoverImage = () => {
    setCoverImageFile(null);
    setPreviewCoverImageUrl(undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={cardBg} borderRadius="lg" overflow="hidden">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor} color={textColorPrimary}>
          Edit Site Settings
        </ModalHeader>
        <ModalCloseButton color={textColorPrimary} />
        <ModalBody p={6}>
          {isLoading && !showImageSpinners ? ( // Show a general spinner if initial data is loading
            <Flex justify="center" align="center" minH="200px">
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : (
            <VStack spacing={5} align="stretch">
              <FormControl id="title">
                <FormLabel color={labelColor}>Site Title</FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Chair App"
                  bg={inputBg}
                  borderColor={borderColor}
                  _placeholder={{ color: placeholderColor }}
                />
              </FormControl>

              <FormControl id="description">
                <FormLabel color={labelColor}>Site Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Your app's mission statement or tagline"
                  bg={inputBg}
                  borderColor={borderColor}
                  _placeholder={{ color: placeholderColor }}
                />
              </FormControl>

              {/* Logo Upload */}
              <FormControl id="logo">
                <FormLabel color={labelColor}>Site Logo</FormLabel>
                <HStack spacing={4} align="center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    p={1}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                  {previewLogoUrl && (
                    <Box position="relative">
                      <Image src={previewLogoUrl} alt="Logo Preview" boxSize="100px" objectFit="contain" />
                      <Button
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="0"
                        right="0"
                        onClick={handleClearLogo}
                      >
                        X
                      </Button>
                    </Box>
                  )}
                  {showImageSpinners && logoFile && <Spinner size="sm" color="brand.500" />}
                </HStack>
              </FormControl>

              {/* Cover Image Upload */}
              <FormControl id="coverImage">
                <FormLabel color={labelColor}>Cover Image</FormLabel>
                <HStack spacing={4} align="center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageFileChange}
                    p={1}
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                  {previewCoverImageUrl && (
                    <Box position="relative">
                      <Image src={previewCoverImageUrl} alt="Cover Image Preview" boxSize="100px" objectFit="contain" />
                      <Button
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="0"
                        right="0"
                        onClick={handleClearCoverImage}
                      >
                        X
                      </Button>
                    </Box>
                  )}
                  {showImageSpinners && coverImageFile && <Spinner size="sm" color="brand.500" />}
                </HStack>
              </FormControl>

              <FormControl id="phone">
                <FormLabel color={labelColor}>Phone Number</FormLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  bg={inputBg}
                  borderColor={borderColor}
                  _placeholder={{ color: placeholderColor }}
                />
              </FormControl>

              <FormControl id="email">
                <FormLabel color={labelColor}>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  bg={inputBg}
                  borderColor={borderColor}
                  _placeholder={{ color: placeholderColor }}
                />
              </FormControl>

              <FormControl id="location">
                <FormLabel color={labelColor}>Location</FormLabel>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="123 Main St, Anytown, USA"
                  bg={inputBg}
                  borderColor={borderColor}
                  _placeholder={{ color: placeholderColor }}
                />
              </FormControl>

              <FormControl id="socialLinks">
                <FormLabel color={labelColor}>Social Media Links</FormLabel>
                <VStack align="stretch" spacing={2}>
                  {socialLinks.map((link, index) => (
                    <HStack key={index} spacing={2}>
                      <Tag size="md" variant="solid" bg={tagBg} color={tagColor} borderRadius="full">
                        <TagLabel>{link.platform}: {link.url}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveSocialLink(index)} />
                      </Tag>
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