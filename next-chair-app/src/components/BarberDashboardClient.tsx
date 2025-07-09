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
  BlogPost,
  SiteSettings,
  SocialLink,
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

  const fetchData = useCallback(async (endpoint: string, setter: Function, type: string) => {
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
                            {barber.bio && Array.isArray(barber.bio) && barber.bio.length > 0 && barber.bio[0].children && barber.bio[0].children.length > 0
                              ? barber.bio[0].children[0].text.substring(0, 50) + '...'
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
                <Text color={textColorSecondary} textAlign="center" py={10}>No barbers found. Click "Add New Barber" to get started!</Text>
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
                        <Th color={textColorPrimary}>Category</Th>
                        <Th color={textColorPrimary}>Duration</Th>
                        <Th color={textColorPrimary}>Price</Th>
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
                          <Td color={textColorSecondary}>{service.category?.title || 'N/A'}</Td>
                          <Td color={textColorSecondary}>{service.duration} mins</Td>
                          <Td color={textColorSecondary}>${service.price.toFixed(2)}</Td>
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
                <Text color={textColorSecondary} textAlign="center" py={10}>No services found. Click "Add New Service" to get started!</Text>
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
                        <Th color={textColorPrimary}>Loyalty Points</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {customers.map((customer) => (
                        <Tr key={customer._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td color={textColorSecondary}>{customer.name}</Td>
                          <Td color={textColorSecondary}>{customer.email}</Td>
                          <Td color={textColorSecondary}>{customer.phone || 'N/A'}</Td>
                          <Td color={textColorSecondary}>{customer.loyaltyPoints || 0}</Td>
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
                <Text color={textColorSecondary} textAlign="center" py={10}>No customers found. Click "Add New Customer" to get started!</Text>
              )}
            </TabPanel>

            {/* Appointments Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Appointments</Heading>
                {/* Add button for new appointment if needed, or direct to booking page */}
                <Button colorScheme="brand" as={NextLink} href="/book">Book New Appointment</Button>
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
                        <Th color={textColorPrimary}>Customer</Th>
                        <Th color={textColorPrimary}>Barber</Th>
                        <Th color={textColorPrimary}>Service</Th>
                        <Th color={textColorPrimary}>Date & Time</Th>
                        <Th color={textColorPrimary}>Status</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {appointments.map((appointment) => (
                        <Tr key={appointment._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td color={textColorSecondary}>{appointment.customer.name}</Td>
                          <Td color={textColorSecondary}>{appointment.barber.name}</Td>
                          <Td color={textColorSecondary}>{appointment.service.name}</Td>
                          <Td color={textColorSecondary}>{new Date(appointment.dateTime).toLocaleString()}</Td>
                          <Td color={textColorSecondary}>{appointment.status}</Td>
                          <Td>
                            <HStack spacing={2}>
                              {/* Add Edit/Status Change functionality here */}
                              <Button size="sm" colorScheme="blue" onClick={() => alert('Implement appointment edit/status change')}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(appointment._id, `Appointment for ${appointment.customer.name}`, 'appointment')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary} textAlign="center" py={10}>No appointments found.</Text>
              )}
            </TabPanel>

            {/* Categories Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Categories</Heading>
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
                        <Th color={textColorPrimary}>Title</Th>
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
                          <Td color={textColorSecondary}>{category.description?.substring(0, 70) || 'No description.'}</Td>
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
                <Text color={textColorSecondary} textAlign="center" py={10}>No categories found. Click "Add New Category" to get started!</Text>
              )}
            </TabPanel>

            {/* Gallery Images Tab Panel */}
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
                        <Th color={textColorPrimary}>Caption</Th>
                        <Th color={textColorPrimary}>Tags</Th>
                        <Th color={textColorPrimary}>Featured</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {galleryImages.map((image) => (
                        <Tr key={image._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {image.imageUrl ? (
                              <Image src={image.imageUrl} alt={image.caption || 'Gallery Image'} boxSize="70px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="70px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{image.caption || 'N/A'}</Td>
                          <Td color={textColorSecondary}>
                            <HStack wrap="wrap">
                              {image.tags?.map((tag, idx) => (
                                <Tag key={idx} size="sm" variant="solid" colorScheme="teal">{tag}</Tag>
                              ))}
                            </HStack>
                          </Td>
                          <Td color={textColorSecondary}>{image.featured ? 'Yes' : 'No'}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="sm" colorScheme="blue" onClick={() => handleEditGalleryImage(image)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(image._id, image.caption || 'Gallery Image', 'galleryImage')}>Delete</Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color={textColorSecondary} textAlign="center" py={10}>No gallery images found. Click "Add New Image" to get started!</Text>
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
                        <Th color={textColorPrimary}>Customer</Th>
                        <Th color={textColorPrimary}>Quote Snippet</Th>
                        <Th color={textColorPrimary}>Rating</Th>
                        <Th color={textColorPrimary}>Date</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {testimonials.map((testimonial) => (
                        <Tr key={testimonial._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {testimonial.imageUrl ? (
                              <Image src={testimonial.imageUrl} alt={testimonial.customerName} boxSize="50px" objectFit="cover" borderRadius="full" />
                            ) : (
                              <Box boxSize="50px" bg="gray.200" borderRadius="full" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{testimonial.customerName}</Td>
                          <Td color={textColorSecondary}>{testimonial.quote.substring(0, 70)}...</Td>
                          <Td color={textColorSecondary}>{testimonial.rating} ⭐</Td>
                          <Td color={textColorSecondary}>{testimonial.date ? new Date(testimonial.date).toLocaleDateString() : 'N/A'}</Td>
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
                <Text color={textColorSecondary} textAlign="center" py={10}>No testimonials found. Click "Add New Testimonial" to get started!</Text>
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
                        <Th color={textColorPrimary}>Cover</Th>
                        <Th color={textColorPrimary}>Title</Th>
                        <Th color={textColorPrimary}>Author</Th>
                        <Th color={textColorPrimary}>Published Date</Th>
                        <Th color={textColorPrimary}>Tags</Th>
                        <Th color={textColorPrimary}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {blogPosts.map((post) => (
                        <Tr key={post._id} borderBottom="1px solid" borderColor={tableBorderColor}>
                          <Td>
                            {post.coverImageUrl ? (
                              <Image src={post.coverImageUrl} alt={post.title} boxSize="70px" objectFit="cover" borderRadius="md" />
                            ) : (
                              <Box boxSize="70px" bg="gray.200" borderRadius="md" />
                            )}
                          </Td>
                          <Td color={textColorSecondary}>{post.title}</Td>
                          <Td color={textColorSecondary}>{post.author || 'N/A'}</Td>
                          <Td color={textColorSecondary}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}</Td>
                          <Td color={textColorSecondary}>
                            <HStack wrap="wrap">
                              {post.tags?.map((tag, idx) => (
                                <Tag key={idx} size="sm" variant="solid" colorScheme="purple">{tag}</Tag>
                              ))}
                            </HStack>
                          </Td>
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
                <Text color={textColorSecondary} textAlign="center" py={10}>No blog posts found. Click "Add New Blog Post" to get started!</Text>
              )}
            </TabPanel>

            {/* Site Settings Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color={textColorPrimary}>Manage Site Settings</Heading>
                <Button colorScheme="brand" onClick={handleEditSiteSettings}>Edit Site Settings</Button>
              </Flex>
              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : (
                <Box bg={cardBg} borderRadius="lg" shadow="md" border="1px solid" borderColor={cardBorderColor} p={6}>
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="lg" fontWeight="bold" color={textColorPrimary}>Current Site Settings:</Text>
                    <Flex align="center">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Title:</Text>
                      <Text color={textColorPrimary}>{siteSettings.title || 'N/A'}</Text>
                    </Flex>
                    <Flex align="flex-start">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Description:</Text>
                      <Text color={textColorPrimary}>{siteSettings.description || 'N/A'}</Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Phone:</Text>
                      <Text color={textColorPrimary}>{siteSettings.phone || 'N/A'}</Text>
                    </Flex>
                    <Flex align="center">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Email:</Text>
                      <Text color={textColorPrimary}>{siteSettings.email || 'N/A'}</Text>
                    </Flex>
                    <Flex align="flex-start">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Location:</Text>
                      <Text color={textColorPrimary}>{siteSettings.location || 'N/A'}</Text>
                    </Flex>
                    <Flex align="flex-start">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Social Links:</Text>
                      <VStack align="flex-start" spacing={1}>
                        {siteSettings.socialLinks && siteSettings.socialLinks.length > 0 ? (
                          siteSettings.socialLinks.map((link, index) => (
                            <Text key={index} color={textColorPrimary}>
                              {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}: <Link href={link.url} isExternal color="brand.500">{link.url}</Link>
                            </Text>
                          ))
                        ) : (
                          <Text color={textColorSecondary}>N/A</Text>
                        )}
                      </VStack>
                    </Flex>
                    <HStack align="flex-start">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Logo:</Text>
                      {siteSettings.logoUrl ? (
                        <Image src={siteSettings.logoUrl} alt="Site Logo" boxSize="80px" objectFit="contain" borderRadius="md" />
                      ) : (
                        <Text color={textColorSecondary}>N/A</Text>
                      )}
                    </HStack>
                    <HStack align="flex-start">
                      <Text fontWeight="semibold" minW="120px" color={textColorSecondary}>Cover Image:</Text>
                      {siteSettings.coverImageUrl ? (
                        <Image src={siteSettings.coverImageUrl} alt="Homepage Cover" boxSize="150px" objectFit="cover" borderRadius="md" />
                      ) : (
                        <Text color={textColorSecondary}>N/A</Text>
                      )}
                    </HStack>
                  </VStack>
                </Box>
              )}
            </TabPanel>

          </TabPanels>
        </Tabs>
      </Container>

      {/* Add/Edit Barber Modal */}
      <AddBarberModal
        isOpen={isAddBarberModalOpen}
        onClose={handleCloseBarberModal}
        onBarberSaved={refreshBarbers}
        initialBarber={selectedBarberToEdit}
      />

      {/* Add/Edit Service Modal */}
      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={handleCloseServiceModal}
        onServiceSaved={refreshServices}
        initialService={selectedServiceToEdit}
      />

      {/* Add/Edit Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onCategorySaved={refreshCategories}
        initialCategory={selectedCategoryToEdit}
      />

      {/* Add/Edit Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        onCustomerSaved={refreshCustomers}
        initialCustomer={selectedCustomerToEdit}
      />

      {/* Add/Edit Gallery Image Modal */}
      <AddGalleryImageModal
        isOpen={isAddGalleryImageModalOpen}
        onClose={handleCloseGalleryImageModal}
        onImageSaved={refreshGalleryImages}
        initialImage={selectedGalleryImageToEdit}
      />

      {/* Add/Edit Testimonial Modal */}
      <AddTestimonialModal
        isOpen={isAddTestimonialModalOpen}
        onClose={handleCloseTestimonialModal}
        onTestimonialSaved={refreshTestimonials}
        initialTestimonial={selectedTestimonialToEdit}
      />

      {/* Add/Edit Blog Post Modal */}
      <AddBlogPostModal
        isOpen={isAddBlogPostModalOpen}
        onClose={handleCloseBlogPostModal}
        onBlogPostSaved={refreshBlogPosts}
        initialBlogPost={selectedBlogPostToEdit}
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
