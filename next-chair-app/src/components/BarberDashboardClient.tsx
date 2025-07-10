// src/components/BarberDashboardClient.tsx
'use client'

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Button,
  Stack,
  Link,
  useColorModeValue,
  useTheme,
  useDisclosure, // Import useDisclosure for modal control
  Spinner, // For loading states
  useToast, // For notifications
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tag, // For displaying tags in blog posts/gallery
  HStack,
  VStack, // Added for spacing buttons
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { PortableText } from '@portabletext/react';
import { AddBarberModal } from './AddBarberModal';
import { AddServiceModal } from './AddServiceModal';
import { AddCategoryModal } from './AddCategoryModal';
import { AddCustomerModal } from './AddCustomerModal';
import { AddGalleryImageModal } from './AddGalleryImageModal';
import { AddTestimonialModal } from './AddTestimonialModal';
import { AddBlogPostModal } from './AddBlogPostModal';
import { EditSiteSettingsModal } from './EditSiteSettingsModal';

// IMPORT INTERFACES FROM THE NEW SERVER COMPONENT PATH
import type {
  Barber,
  Service,
  Customer,
  Appointment,
  Category,
  GalleryImage,
  Testimonial,
  BlogPost, // Keep the original BlogPost type from manage/page
  SiteSettings,
} from '@/app/barber-dashboard/manage/page'; // <--- UPDATED PATH HERE

import { urlFor, client } from '@/lib/sanity';
import { useRouter } from 'next/navigation';
import { groq } from 'next-sanity';


// Define interface for the props received from the server component
interface BarberDashboardClientProps {
  barbers: Barber[];
  services: Service[];
  customers: Customer[];
  appointments: Appointment[];
  categories: Category[];
  galleryImages: GalleryImage[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  siteSettings: SiteSettings;
}

// Define a local interface that matches what AddBlogPostModal *expects* for its initialBlogPost prop.
// This is a workaround because the AddBlogPostModal's expected type for 'author' is a string,
// while the actual BlogPost type has 'author' as an object.
// Updated to ensure 'title', 'slug', 'publishedAt', and 'coverImageUrl' are non-optional strings/objects
// to match the expected type by the AddBlogPostModal.
interface BlogPostForAddBlogPostModal {
  _id?: string; // Optional for new posts or if the modal handles it
  title: string; // Expected as non-optional string by the modal
  slug: { current: string }; // Expected as non-optional object with 'current' string
  author: string; // Expected as string by the modal
  mainImage?: any; // This property is named 'mainImage' in this interface, but will receive 'coverImage' from BlogPost
  // categories?: any[]; // Removed as BlogPost type from Sanity does not seem to have this property directly
  publishedAt: string; // Expected as non-optional string
  body?: any[]; // Assuming 'any[]' or optional
  coverImageUrl: string; // Expected as non-optional string
}


export default function BarberDashboardClient({
  barbers: initialBarbers,
  services: initialServices,
  customers: initialCustomers,
  appointments: initialAppointments,
  categories: initialCategories,
  galleryImages: initialGalleryImages,
  testimonials: initialTestimonials,
  blogPosts: initialBlogPosts,
  siteSettings: initialSiteSettings,
}: BarberDashboardClientProps) {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();

  // State for each data type
  const [barbers, setBarbers] = useState<Barber[]>(initialBarbers);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialGalleryImages);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);


  // Loading state for initial data fetch (from props, not from client-side fetch)
  const [isLoadingData, setIsLoadingData] = useState(false); // This primarily indicates if a refresh is happening

  // Modals for Barbers
  const { isOpen: isAddBarberModalOpen, onOpen: onAddBarberModalOpen, onClose: onAddBarberModalClose } = useDisclosure();
  const [selectedBarberToEdit, setSelectedBarberToEdit] = useState<Barber | null>(null);

  // Modals for Services
  const { isOpen: isAddServiceModalOpen, onOpen: onAddServiceModalOpen, onClose: onAddServiceModalClose } = useDisclosure();
  const [selectedServiceToEdit, setSelectedServiceToEdit] = useState<Service | null>(null);

  // Modals for Categories
  const { isOpen: isAddCategoryModalOpen, onOpen: onAddCategoryModalOpen, onClose: onAddCategoryModalClose } = useDisclosure();
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<Category | null>(null);

  // Modals for Customers
  const { isOpen: isAddCustomerModalOpen, onOpen: onAddCustomerModalOpen, onClose: onAddCustomerModalClose } = useDisclosure();
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<Customer | null>(null);

  // Modals for Gallery Images
  const { isOpen: isAddGalleryImageModalOpen, onOpen: onAddGalleryImageModalOpen, onClose: onAddGalleryImageModalClose } = useDisclosure();
  const [selectedGalleryImageToEdit, setSelectedGalleryImageToEdit] = useState<GalleryImage | null>(null);

  // Modals for Testimonials
  const { isOpen: isAddTestimonialModalOpen, onOpen: onAddTestimonialModalOpen, onClose: onAddTestimonialModalClose } = useDisclosure();
  const [selectedTestimonialToEdit, setSelectedTestimonialToEdit] = useState<Testimonial | null>(null);

  // Modals for Blog Posts
  const { isOpen: isAddBlogPostModalOpen, onOpen: onAddBlogPostModalOpen, onClose: onAddBlogPostModalClose } = useDisclosure();
  const [selectedBlogPostToEdit, setSelectedBlogPostToEdit] = useState<BlogPost | null>(null);

  // Modals for Site Settings (singleton, so just edit modal)
  const { isOpen: isEditSiteSettingsModalOpen, onOpen: onEditSiteSettingsModalOpen, onClose: onEditSiteSettingsModalClose } = useDisclosure();


  // Universal Delete Confirmation Dialog
  const { isOpen: isConfirmDeleteOpen, onOpen: onConfirmDeleteOpen, onClose: onConfirmDeleteClose } = useDisclosure();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = React.useRef(null);

  // --- Data Fetching and Refresh Functions ---

  const fetchData = useCallback(async (endpoint: string, setter: React.Dispatch<React.SetStateAction<any>>, type: string) => {
    setIsLoadingData(true); // Indicate that data is being refreshed
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }
      const data = await response.json();

      // Re-apply image URL mapping as the data comes from the API route (which might not have it pre-mapped)
      // The server component's initial props already have this, but client-side refreshes need it.
      if (type === 'barbers') {
        setter((data as Barber[]).map(item => ({ ...item, imageUrl: item.image ? urlFor(item.image).url() : undefined })));
      } else if (type === 'services') {
        setter((data as Service[]).map(item => ({ ...item, imageUrl: item.image ? urlFor(item.image).url() : undefined })));
      } else if (type === 'categories') {
        setter((data as Category[]).map(item => ({ ...item, imageUrl: item.image ? urlFor(item.image).url() : undefined })));
      } else if (type === 'gallery images') { // Note: type string here matches how it's called
        setter((data as GalleryImage[]).map(item => ({ ...item, imageUrl: item.image ? urlFor(item.image).url() : undefined })));
      } else if (type === 'testimonials') {
        setter((data as Testimonial[]).map(item => ({ ...item, imageUrl: item.image ? urlFor(item.image).url() : undefined })));
      } else if (type === 'blog posts') { // Note: type string here matches how it's called
        setter((data as BlogPost[]).map(item => ({ ...item, coverImageUrl: item.coverImage ? urlFor(item.coverImage).url() : undefined })));
      } else if (type === 'site settings') { // Note: type string here matches how it's called
        setter({
          ...data,
          logoUrl: data.logo ? urlFor(data.logo).url() : undefined,
          coverImageUrl: data.coverImage ? urlFor(data.coverImage).url() : undefined,
        });
      } else {
        setter(data);
      }
    } catch (error: any) {
      toast({
        title: `Error fetching ${type}.`,
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setter([]); // Set to empty array on error
    } finally {
      setIsLoadingData(false); // End loading state
    }
  }, [toast]);

  const refreshBarbers = useCallback(() => fetchData('/api/barbers', setBarbers, 'barbers'), [fetchData]);
  const refreshServices = useCallback(() => fetchData('/api/services', setServices, 'services'), [fetchData]);
  const refreshCustomers = useCallback(() => fetchData('/api/customers', setCustomers, 'customers'), [fetchData]);
  const refreshAppointments = useCallback(() => fetchData('/api/appointments', setAppointments, 'appointments'), [fetchData]);
  const refreshCategories = useCallback(() => fetchData('/api/categories', setCategories, 'categories'), [fetchData]);
  const refreshGalleryImages = useCallback(() => fetchData('/api/galleryImages', setGalleryImages, 'gallery images'), [fetchData]);
  const refreshTestimonials = useCallback(() => fetchData('/api/testimonials', setTestimonials, 'testimonials'), [fetchData]);
  const refreshBlogPosts = useCallback(() => fetchData('/api/blogPosts', setBlogPosts, 'blog posts'), [fetchData]);
  const refreshSiteSettings = useCallback(() => fetchData('/api/siteSettings', setSiteSettings, 'site settings'), [fetchData]);


  // Initial data load from props and subsequent refreshes
  // These useEffects ensure the state is updated when initial props change (e.g., on first load or server re-render)
  useEffect(() => { setBarbers(initialBarbers); }, [initialBarbers]);
  useEffect(() => { setServices(initialServices); }, [initialServices]);
  useEffect(() => { setCustomers(initialCustomers); }, [initialCustomers]);
  useEffect(() => { setAppointments(initialAppointments); }, [initialAppointments]);
  useEffect(() => { setCategories(initialCategories); }, [initialCategories]);
  useEffect(() => { setGalleryImages(initialGalleryImages); }, [initialGalleryImages]);
  useEffect(() => { setTestimonials(initialTestimonials); }, [initialTestimonials]);
  useEffect(() => { setBlogPosts(initialBlogPosts); }, [initialBlogPosts]);
  useEffect(() => { setSiteSettings(initialSiteSettings); }, [initialSiteSettings]);


  // --- Handlers for Modals ---

  // Barber Handlers
  const handleAddBarber = () => {
    setSelectedBarberToEdit(null);
    onAddBarberModalOpen();
  };

  const handleEditBarber = (barber: Barber) => {
    setSelectedBarberToEdit(barber);
    onAddBarberModalOpen();
  };

  const handleCloseBarberModal = () => {
    setSelectedBarberToEdit(null);
    onAddBarberModalClose();
  };

  // Service Handlers
  const handleAddService = () => {
    setSelectedServiceToEdit(null);
    onAddServiceModalOpen();
  };

  const handleEditService = (service: Service) => {
    setSelectedServiceToEdit(service);
    onAddServiceModalOpen();
  };

  const handleCloseServiceModal = () => {
    setSelectedServiceToEdit(null);
    onAddServiceModalClose();
  };

  // Category Handlers
  const handleAddCategory = () => {
    setSelectedCategoryToEdit(null);
    onAddCategoryModalOpen();
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategoryToEdit(category);
    onAddCategoryModalOpen();
  };

  const handleCloseCategoryModal = () => {
    setSelectedCategoryToEdit(null);
    onAddCategoryModalClose();
  };

  // Customer Handlers
  const handleAddCustomer = () => {
    setSelectedCustomerToEdit(null);
    onAddCustomerModalOpen();
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomerToEdit(customer);
    onAddCustomerModalOpen();
  };

  const handleCloseCustomerModal = () => {
    setSelectedCustomerToEdit(null);
    onAddCustomerModalClose();
  };

  // Gallery Image Handlers
  const handleAddGalleryImage = () => {
    setSelectedGalleryImageToEdit(null);
    onAddGalleryImageModalOpen();
  };

  const handleEditGalleryImage = (image: GalleryImage) => {
    setSelectedGalleryImageToEdit(image);
    onAddGalleryImageModalOpen();
  };

  const handleCloseGalleryImageModal = () => {
    setSelectedGalleryImageToEdit(null);
    onAddGalleryImageModalClose();
  };

  // Testimonial Handlers
  const handleAddTestimonial = () => {
    setSelectedTestimonialToEdit(null);
    onAddTestimonialModalOpen();
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonialToEdit(testimonial);
    onAddTestimonialModalOpen();
  };

  const handleCloseTestimonialModal = () => {
    setSelectedTestimonialToEdit(null);
    onAddTestimonialModalClose();
  };

  // Blog Post Handlers
  const handleAddBlogPost = () => {
    setSelectedBlogPostToEdit(null);
    onAddBlogPostModalOpen();
  };

  const handleEditBlogPost = (post: BlogPost) => {
    setSelectedBlogPostToEdit(post);
    onAddBlogPostModalOpen();
  };

  const handleCloseBlogPostModal = () => {
    setSelectedBlogPostToEdit(null);
    onAddBlogPostModalClose();
  };

  // Site Settings Handler (no add, only edit)
  const handleEditSiteSettings = () => {
    onEditSiteSettingsModalOpen();
  };

  // --- Universal Delete Handler ---
  const handleDeleteClick = (id: string, name: string, type: string) => {
    setItemToDelete({ id, name, type });
    onConfirmDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      // Adjust endpoint for pluralization and specific types
      let endpoint = '';
      switch (itemToDelete.type) {
        case 'barber':
        case 'service':
        case 'customer':
        case 'category':
        case 'testimonial':
        case 'blogPost':
          endpoint = `/api/${itemToDelete.type}s?id=${itemToDelete.id}`;
          break;
        case 'galleryImage':
          endpoint = `/api/galleryImages?id=${itemToDelete.id}`; // Already plural
          break;
        case 'siteSettings':
          endpoint = `/api/siteSettings?id=${itemToDelete.id}`; // Singleton, but use ID for specific deletion
          break;
        case 'appointment':
            endpoint = `/api/appointments?id=${itemToDelete.id}`; // Assuming an appointments API route
            break;
        default:
          throw new Error(`Unknown item type for deletion: ${itemToDelete.type}`);
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete ${itemToDelete.type}.`);
      }

      toast({
        title: `${itemToDelete.type} deleted.`,
        description: `"${itemToDelete.name}" has been successfully deleted.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh the appropriate list
      switch (itemToDelete.type) {
        case 'barber':
          refreshBarbers();
          break;
        case 'service':
          refreshServices();
          break;
        case 'customer':
          refreshCustomers();
          break;
        case 'category':
          refreshCategories();
          break;
        case 'galleryImage':
          refreshGalleryImages();
          break;
        case 'testimonial':
          refreshTestimonials();
          break;
        case 'blogPost':
          refreshBlogPosts();
          break;
        case 'siteSettings':
            refreshSiteSettings();
            break;
        case 'appointment':
            refreshAppointments();
            break;
      }

      onConfirmDeleteClose();
    } catch (error: any) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      toast({
        title: `Error deleting ${itemToDelete.type}.`,
        description: error.message || 'There was an error deleting the item. Please try again.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };


  // --- Color Mode Values ---
  const bgColor = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-surface'], theme.colors.neutral.dark['bg-surface']);
  const cardBorderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const tableHeaderBg = useColorModeValue('gray.100', 'gray.600');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');


  return (
    <Box bg={bgColor} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8} wrap="wrap">
          <Heading as="h1" size="xl" color={textColorPrimary} mb={{ base: 4, md: 0 }}>
            Barber Dashboard (Manage Data)
          </Heading>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Button colorScheme="brand" onClick={() => router.push('/')}>
              View Customer Site
            </Button>
            <Button colorScheme="green" onClick={() => router.push('/admin-reports')}>
              View Reports
            </Button>
            {/* New button to go back to the daily appointments view */}
            <Button colorScheme="purple" onClick={() => router.push('/barber-dashboard')}>
              Today's Appointments
            </Button>
          </Stack>
        </Flex>

        <Tabs variant="enclosed" colorScheme="brand" isLazy>
          <TabList overflowX="auto" pb={2}>
            <Tab color={textColorPrimary}>Barbers</Tab>
            <Tab color={textColorPrimary}>Services</Tab>
            <Tab color={textColorPrimary}>Customers</Tab>
            <Tab color={textColorPrimary}>Appointments</Tab>
            <Tab color={textColorPrimary}>Categories</Tab>
            <Tab color={textColorPrimary}>Gallery</Tab>
            <Tab color={textColorPrimary}>Testimonials</Tab>
            <Tab color={textColorPrimary}>Blog Posts</Tab>
            <Tab color={textColorPrimary}>Site Settings</Tab>
          </TabList>

          <TabPanels>
            {/* Barbers Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Barbers</Heading>
                <Button colorScheme="brand" onClick={handleAddBarber}>Add New Barber</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : barbers.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Image</Th>
                        <Th color={textColorPrimary}>Name</Th>
                        <Th color={textColorPrimary}>Bio Snippet</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {barbers.map((barber) => (
                        <Tr key={barber._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {barber.imageUrl ? (
                              <Image src={barber.imageUrl} alt={barber.name} boxSize="50px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{barber.name}</Td>
                          <Td color={textColorSecondary}>
                            {barber.bio && Array.isArray(barber.bio) && barber.bio.length > 0 && barber.bio[0].children && barber.bio[0].children.length > 0 ?
                              barber.bio[0].children[0].text.substring(0, 50) + '...'
                              : 'No bio.'}
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditBarber(barber)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(barber._id, barber.name, 'barber')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No barbers found. Add a new barber to get started.</Text>
              )}
            </TabPanel>

            {/* Services Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Services</Heading>
                <Button colorScheme="brand" onClick={handleAddService}>Add New Service</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : services.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Image</Th>
                        <Th color={textColorPrimary}>Name</Th>
                        <Th color={textColorPrimary}>Description</Th>
                        <Th color={textColorPrimary}>Price</Th>
                        <Th color={textColorPrimary}>Duration (mins)</Th>
                        <Th color={textColorPrimary}>Category</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {services.map((service) => (
                        <Tr key={service._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {service.imageUrl ? (
                              <Image src={service.imageUrl} alt={service.name} boxSize="50px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{service.name}</Td>
                          <Td color={textColorSecondary}>{service.description?.substring(0, 50)}...</Td>
                          <Td color={textColorSecondary}>${service.price?.toFixed(2)}</Td>
                          <Td color={textColorSecondary}>{service.duration}</Td>
                          <Td color={textColorSecondary}>{service.category?.title || 'N/A'}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditService(service)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(service._id, service.name, 'service')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No services found. Add a new service to get started.</Text>
              )}
            </TabPanel>

            {/* Customers Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Customers</Heading>
                <Button colorScheme="brand" onClick={handleAddCustomer}>Add New Customer</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : customers.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Name</Th>
                        <Th color={textColorPrimary}>Email</Th>
                        <Th color={textColorPrimary}>Phone</Th>
                        <Th color={textColorPrimary}>Total Appts.</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {customers.map((customer) => (
                        <Tr key={customer._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td color={textColorSecondary}>{customer.name}</Td>
                          <Td color={textColorSecondary}>{customer.email}</Td>
                          <Td color={textColorSecondary}>{customer.phone}</Td>
                          <Td color={textColorSecondary}>{customer.appointmentCount || 0}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditCustomer(customer)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(customer._id, customer.name, 'customer')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No customers found. Add a new customer to get started.</Text>
              )}
            </TabPanel>

            {/* Appointments Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Appointments</Heading>
                {/* No direct "Add Appointment" button here, as appointments are usually booked by customers */}
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : appointments.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Date</Th>
                        <Th color={textColorPrimary}>Time</Th>
                        <Th color={textColorPrimary}>Customer</Th>
                        <Th color={textColorPrimary}>Barber</Th>
                        <Th color={textColorPrimary}>Service</Th>
                        <Th color={textColorPrimary}>Status</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {appointments.map((appointment) => (
                        <Tr key={appointment._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td color={textColorSecondary}>{new Date(appointment.dateTime).toLocaleDateString()}</Td>
                          <Td color={textColorSecondary}>{new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Td>
                          <Td color={textColorSecondary}>{appointment.customer?.name || 'N/A'}</Td>
                          <Td color={textColorSecondary}>{appointment.barber?.name || 'N/A'}</Td>
                          <Td color={textColorSecondary}>{appointment.service?.name || 'N/A'}</Td>
                          <Td>
                            <Tag
                              size="sm"
                              variant="subtle"
                              colorScheme={
                                appointment.status === 'confirmed' ? 'green' : // Green for confirmed
                                appointment.status === 'pending' ? 'orange' :   // Orange for pending
                                appointment.status === 'completed' ? 'purple' : // Purple for completed (distinct from confirmed)
                                appointment.status === 'cancelled' ? 'red' : 'gray' // Red for cancelled, gray as default
                              }
                            >
                              {appointment.status}
                            </Tag>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              {/* No edit for appointments - typically managed via state changes or specific UIs */}
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(appointment._id, `Appointment on ${new Date(appointment.dateTime).toLocaleDateString()}`, 'appointment')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No appointments found.</Text>
              )}
            </TabPanel>

            {/* Categories Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Service Categories</Heading>
                <Button colorScheme="brand" onClick={handleAddCategory}>Add New Category</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : categories.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Image</Th>
                        <Th color={textColorPrimary}>Name</Th>
                        <Th color={textColorPrimary}>Description</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {categories.map((category) => (
                        <Tr key={category._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {category.imageUrl ? (
                              <Image src={category.imageUrl} alt={category.title} boxSize="50px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                         <Td color={textColorSecondary}>{category.title}</Td>
                          <Td color={textColorSecondary}>{category.description?.substring(0, 50)}...</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditCategory(category)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(category._id, category.title, 'category')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No categories found. Add a new category to get started.</Text>
              )}
            </TabPanel>

            {/* Gallery Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Gallery Images</Heading>
                <Button colorScheme="brand" onClick={handleAddGalleryImage}>Add New Image</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : galleryImages.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Image</Th>
                        <Th color={textColorPrimary}>Title</Th>
                        <Th color={textColorPrimary}>Description</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {galleryImages.map((image) => (
                        <Tr key={image._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {image.imageUrl ? (
                              <Image src={image.imageUrl} alt={image.title} boxSize="50px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{image.title}</Td>
                          <Td color={textColorSecondary}>{image.description?.substring(0, 50)}...</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditGalleryImage(image)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(image._id, image.title ?? 'Untitled', 'galleryImage')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No gallery images found. Add a new image to get started.</Text>
              )}
            </TabPanel>

            {/* Testimonials Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Testimonials</Heading>
                <Button colorScheme="brand" onClick={handleAddTestimonial}>Add New Testimonial</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : testimonials.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Image</Th>
                        <Th color={textColorPrimary}>Customer Name</Th>
                        <Th color={textColorPrimary}>Rating</Th>
                        <Th color={textColorPrimary}>Comment</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {testimonials.map((testimonial) => (
                        <Tr key={testimonial._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {testimonial.imageUrl ? (
                              <Image src={testimonial.imageUrl} alt={testimonial.customerName} boxSize="50px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{testimonial.customerName}</Td>
                          <Td color={textColorSecondary}>{testimonial.rating}</Td>
                          <Td color={textColorSecondary}>{testimonial.comment?.substring(0, 50)}...</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditTestimonial(testimonial)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(testimonial._id, testimonial.customerName, 'testimonial')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No testimonials found. Add a new testimonial to get started.</Text>
              )}
            </TabPanel>

            {/* Blog Posts Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Blog Posts</Heading>
                <Button colorScheme="brand" onClick={handleAddBlogPost}>Add New Blog Post</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : blogPosts.length > 0 ? (
                <Box overflowX="auto" bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor}>
                  <Table variant="simple">
                    <Thead>
                      <Tr bg={tableHeaderBg}>
                        <Th color={textColorPrimary}>Image</Th>
                        <Th color={textColorPrimary}>Title</Th>
                        <Th color={textColorPrimary}>Author</Th>
                        <Th color={textColorPrimary}>Published Date</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {blogPosts.map((post) => (
                        <Tr key={post._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {post.coverImageUrl ? (
                              <Image src={post.coverImageUrl} alt={post.title} boxSize="50px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{post.title}</Td>
                          <Td color={textColorSecondary}>{post.author.name}</Td>
                          <Td color={textColorSecondary}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditBlogPost(post)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(post._id, post.title, 'blogPost')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary}>No blog posts found. Add a new blog post to get started.</Text>
              )}
            </TabPanel>

            {/* Site Settings Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Site Settings</Heading>
                <Button colorScheme="brand" onClick={handleEditSiteSettings}>Edit Site Settings</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : (
                <Box bg={cardBg} borderRadius="lg" shadow="md" p={6} border="1px solid" borderColor={cardBorderColor}>
                  <VStack align="stretch" spacing={4}>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Title:</Text>
                      <Text color={textColorSecondary}>{siteSettings.title || 'N/A'}</Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Description:</Text>
                      <Text color={textColorSecondary}>{siteSettings.description || 'N/A'}</Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Logo:</Text>
                      {siteSettings.logoUrl ? (
                        <Image src={siteSettings.logoUrl} alt="Site Logo" boxSize="50px" objectFit="contain" />
                      ) : (
                        <Text color={textColorSecondary}>N/A</Text>
                      )}
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Cover Image:</Text>
                      {siteSettings.coverImageUrl ? (
                        <Image src={siteSettings.coverImageUrl} alt="Site Cover" boxSize="100px" objectFit="contain" />
                      ) : (
                        <Text color={textColorSecondary}>N/A</Text>
                      )}
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Phone:</Text>
                      <Text color={textColorSecondary}>{siteSettings.phone || 'N/A'}</Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Email:</Text>
                      <Text color={textColorSecondary}>{siteSettings.email || 'N/A'}</Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Location:</Text>
                      <Text color={textColorSecondary}>{siteSettings.location || 'N/A'}</Text>
                    </Flex>
                    <Flex align="start">
                      <Text fontWeight="bold" color={textColorPrimary} minW="120px">Social Links:</Text>
                      <VStack align="start" spacing={1}>
                        {siteSettings.socialLinks && siteSettings.socialLinks.length > 0 ? (
                          siteSettings.socialLinks.map((link, index) => (
                            <Link key={index} href={link.url} isExternal color="brand.500">
                              {link.platform}: {link.url}
                            </Link>
                          ))
                        ) : (
                          <Text color={textColorSecondary}>N/A</Text>
                        )}
                      </VStack>
                    </Flex>
                  </VStack>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      {/* Modals */}
      <AddBarberModal
        isOpen={isAddBarberModalOpen}
        onClose={handleCloseBarberModal}
        onBarberSaved={refreshBarbers}
        initialBarber={selectedBarberToEdit}
      />

      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={handleCloseServiceModal}
        onServiceSaved={refreshServices}
        initialService={selectedServiceToEdit}
        categories={categories} // Pass categories to service modal
      />

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onCategorySaved={refreshCategories}
        initialCategory={selectedCategoryToEdit}
      />

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        onCustomerSaved={refreshCustomers}
        initialCustomer={selectedCustomerToEdit}
      />

      <AddGalleryImageModal
        isOpen={isAddGalleryImageModalOpen}
        onClose={handleCloseGalleryImageModal}
        onImageSaved={refreshGalleryImages}
        initialImage={selectedGalleryImageToEdit} // Changed prop name to match updated interface
      />

      <AddTestimonialModal
        isOpen={isAddTestimonialModalOpen}
        onClose={handleCloseTestimonialModal}
        onTestimonialSaved={refreshTestimonials}
        initialTestimonial={selectedTestimonialToEdit}
      />

      <AddBlogPostModal
        isOpen={isAddBlogPostModalOpen}
        onClose={handleCloseBlogPostModal}
        onBlogPostSaved={refreshBlogPosts}
        // Construct an object that matches the expected type for initialBlogPost in AddBlogPostModal
        // This explicitly converts the 'author' object to a string (the author's name)
        initialBlogPost={selectedBlogPostToEdit ? {
          _id: selectedBlogPostToEdit._id,
          title: selectedBlogPostToEdit.title || '', // Ensure title is always a string
          slug: selectedBlogPostToEdit.slug || { current: '' }, // Ensure slug is always an object
          author: selectedBlogPostToEdit.author?.name || '', // Convert author object to string
          mainImage: selectedBlogPostToEdit.coverImage, // Changed from .mainImage to .coverImage to match Sanity BlogPost type
          // categories: selectedBlogPostToEdit.categories, // Removed this line as BlogPost type does not have 'categories'
          publishedAt: selectedBlogPostToEdit.publishedAt || '', // Ensure publishedAt is always a string
          body: selectedBlogPostToEdit.body, // Pass directly, assuming 'any[]' or optional
          coverImageUrl: selectedBlogPostToEdit.coverImageUrl || '', // Ensure coverImageUrl is always a string
        } as BlogPostForAddBlogPostModal : null}
      />

      {/* Edit Site Settings Modal */}
      <EditSiteSettingsModal
        isOpen={isEditSiteSettingsModalOpen}
        onClose={onEditSiteSettingsModalClose}
        onSettingsSaved={refreshSiteSettings}
      />

      {/* Universal Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isConfirmDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onConfirmDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={cardBg} color={textColorPrimary}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {itemToDelete?.type}
            </AlertDialogHeader>

            <AlertDialogBody color={textColorSecondary}>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter borderTop="1px solid" borderColor={tableBorderColor}>
              <Button ref={cancelRef} onClick={onConfirmDeleteClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} isLoading={isDeleting}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Box>
  );
}