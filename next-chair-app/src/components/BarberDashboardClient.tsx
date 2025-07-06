// src/components/BarberDashboardClient.tsx
'use client'

import React, { useState } from 'react'; // Ensure React is explicitly imported
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
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { PortableText } from '@portabletext/react';

// Define interfaces for the props received from the server component
interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  imageUrl?: string;
  bio?: any;
  dailyAvailability?: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: { _id: string; title: string };
  barbers?: Array<{ _id: string; name: string }>;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Appointment {
  _id: string;
  customer: { _id: string; name: string; email: string };
  barber: { _id: string; name: string };
  service: { _id: string; name: string };
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  log?: any[];
}

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  imageUrl?: string;
}

interface GalleryImage {
  _id: string;
  imageUrl: string;
  caption?: string;
  tags?: string[];
  featured: boolean;
}

interface Testimonial {
  _id: string;
  customerName: string;
  quote: string;
  rating: number;
  date?: string;
  imageUrl?: string;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  content?: any[];
  coverImageUrl?: string;
  author?: string;
}

interface BarberDashboardClientProps {
  barbers: Barber[];
  services: Service[];
  customers: Customer[];
  appointments: Appointment[];
  categories: Category[];
  galleryImages: GalleryImage[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
}

export default function BarberDashboardClient({
  barbers,
  services,
  customers,
  appointments,
  categories,
  galleryImages,
  testimonials,
  blogPosts,
}: BarberDashboardClientProps) {
  const [tabIndex, setTabIndex] = useState(0);

  // Static color values for the dashboard
  const bgColor = 'gray.800';
  const headerBg = 'gray.900';
  const textColor = 'gray.100';
  const headingColor = 'purple.300';
  const tabSelectedBg = 'purple.600';
  const tabHoverBg = 'purple.700';
  const tableHeaderBg = 'gray.700';
  const tableRowBg = 'gray.800';
  const tableBorderColor = 'gray.700';

  // Helper to format date and time
  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <Box minH="100vh" bg={bgColor} color={textColor}>
      {/* Header */}
      <Flex
        as="header"
        bg={headerBg}
        color="white"
        p={6}
        shadow="lg"
        align="center"
        justify="space-between"
      >
        <Container
          maxW="container.xl"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Heading as="h1" size="lg" color="white">
            Barber Dashboard
          </Heading>
          <Flex as="nav" gap={4}>
            <Link
              as={NextLink}
              href="/"
              _hover={{ color: 'purple.400' }}
              transition="0.2s"
            >
              Back to Home
            </Link>
          </Flex>
        </Container>
      </Flex>

      <Container maxW="container.xl" py={8}>
        <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="soft-rounded" colorScheme="purple">
          <TabList flexWrap="wrap" justifyContent="center">
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Barbers</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Services</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Customers</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Appointments</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Categories</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Gallery</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Testimonials</Tab>
            <Tab _selected={{ bg: tabSelectedBg }} _hover={{ bg: tabHoverBg }} color={textColor}>Blog Posts</Tab>
          </TabList>

          <TabPanels mt={8}>
            {/* Barbers Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Barbers</Heading>
              <Button colorScheme="purple" mb={4}>Add New Barber</Button>
              {barbers.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Image</Th>
                      <Th color={textColor}>Name</Th>
                      <Th color={textColor}>Slug</Th>
                      <Th color={textColor}>Bio</Th>
                      <Th color={textColor}>Availability</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {barbers.map((barber) => (
                      <Tr key={barber._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>
                          {barber.imageUrl && (
                            <Image src={barber.imageUrl} alt={barber.name} boxSize="50px" objectFit="cover" borderRadius="md" />
                          )}
                        </Td>
                        <Td>{barber.name}</Td>
                        <Td>{barber.slug?.current}</Td>
                        <Td>
                          {barber.bio && (
                            <Text noOfLines={2}>
                              <PortableText value={barber.bio} />
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <Stack>
                            {barber.dailyAvailability?.map((slot, index) => (
                              <Text key={index} fontSize="sm">
                                {slot.dayOfWeek.charAt(0).toUpperCase() + slot.dayOfWeek.slice(1)}: {slot.startTime}-{slot.endTime}
                              </Text>
                            ))}
                          </Stack>
                        </Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No barbers found.</Text>
              )}
            </TabPanel>

            {/* Services Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Services</Heading>
              <Button colorScheme="purple" mb={4}>Add New Service</Button>
              {services.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Name</Th>
                      <Th color={textColor}>Description</Th>
                      <Th color={textColor}>Duration</Th>
                      <Th color={textColor}>Price</Th>
                      <Th color={textColor}>Category</Th>
                      <Th color={textColor}>Barbers</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {services.map((service) => (
                      <Tr key={service._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>{service.name}</Td>
                        <Td>{service.description?.substring(0, 50)}...</Td>
                        <Td>{service.duration} mins</Td>
                        <Td>R{service.price.toFixed(2)}</Td>
                        <Td>{service.category?.title || 'N/A'}</Td>
                        <Td>{service.barbers?.map(b => b.name).join(', ') || 'N/A'}</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No services found.</Text>
              )}
            </TabPanel>

            {/* Customers Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Customers</Heading>
              <Button colorScheme="purple" mb={4}>Add New Customer</Button>
              {customers.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Name</Th>
                      <Th color={textColor}>Email</Th>
                      <Th color={textColor}>Phone</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {customers.map((customer) => (
                      <Tr key={customer._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>{customer.name}</Td>
                        <Td>{customer.email}</Td>
                        <Td>{customer.phone || 'N/A'}</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No customers found.</Text>
              )}
            </TabPanel>

            {/* Appointments Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Appointments</Heading>
              <Button colorScheme="purple" mb={4}>Add New Appointment</Button>
              {appointments.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Customer</Th>
                      <Th color={textColor}>Barber</Th>
                      <Th color={textColor}>Service</Th>
                      <Th color={textColor}>Date & Time</Th>
                      <Th color={textColor}>Status</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {appointments.map((appointment) => (
                      <Tr key={appointment._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>{appointment.customer?.name || 'N/A'}</Td>
                        <Td>{appointment.barber?.name || 'N/A'}</Td>
                        <Td>{appointment.service?.name || 'N/A'}</Td>
                        <Td>{formatDateTime(appointment.dateTime)}</Td>
                        <Td>{appointment.status}</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No appointments found.</Text>
              )}
            </TabPanel>

            {/* Categories Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Categories</Heading>
              <Button colorScheme="purple" mb={4}>Add New Category</Button>
              {categories.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Image</Th>
                      <Th color={textColor}>Title</Th>
                      <Th color={textColor}>Slug</Th>
                      <Th color={textColor}>Description</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {categories.map((category) => (
                      <Tr key={category._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>
                          {category.imageUrl && (
                            <Image src={category.imageUrl} alt={category.title} boxSize="50px" objectFit="cover" borderRadius="md" />
                          )}
                        </Td>
                        <Td>{category.title}</Td>
                        <Td>{category.slug?.current}</Td>
                        <Td>{category.description?.substring(0, 50)}...</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No categories found.</Text>
              )}
            </TabPanel>

            {/* Gallery Images Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Gallery Images</Heading>
              <Button colorScheme="purple" mb={4}>Add New Image</Button>
              {galleryImages.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Image</Th>
                      <Th color={textColor}>Caption</Th>
                      <Th color={textColor}>Tags</Th>
                      <Th color={textColor}>Featured</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {galleryImages.map((image) => (
                      <Tr key={image._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>
                          {image.imageUrl && (
                            <Image src={image.imageUrl} alt={image.caption || 'Gallery Image'} boxSize="50px" objectFit="cover" borderRadius="md" />
                          )}
                        </Td>
                        <Td>{image.caption || 'N/A'}</Td>
                        <Td>{image.tags?.join(', ') || 'N/A'}</Td>
                        <Td>{image.featured ? 'Yes' : 'No'}</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No gallery images found.</Text>
              )}
            </TabPanel>

            {/* Testimonials Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Testimonials</Heading>
              <Button colorScheme="purple" mb={4}>Add New Testimonial</Button>
              {testimonials.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Image</Th>
                      <Th color={textColor}>Customer Name</Th>
                      <Th color={textColor}>Quote</Th>
                      <Th color={textColor}>Rating</Th>
                      <Th color={textColor}>Date</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {testimonials.map((testimonial) => (
                      <Tr key={testimonial._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>
                          {testimonial.imageUrl && (
                            <Image src={testimonial.imageUrl} alt={testimonial.customerName} boxSize="50px" objectFit="cover" borderRadius="md" />
                          )}
                        </Td>
                        <Td>{testimonial.customerName}</Td>
                        <Td>{testimonial.quote.substring(0, 50)}...</Td>
                        <Td>{testimonial.rating} / 5</Td>
                        <Td>{formatDateTime(testimonial.date || '')}</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No testimonials found.</Text>
              )}
            </TabPanel>

            {/* Blog Posts Tab Panel */}
            <TabPanel>
              <Heading size="lg" mb={4} color={headingColor}>Manage Blog Posts</Heading>
              <Button colorScheme="purple" mb={4}>Add New Blog Post</Button>
              {blogPosts.length > 0 ? (
                <Table variant="simple" size="sm" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th color={textColor}>Cover Image</Th>
                      <Th color={textColor}>Title</Th>
                      <Th color={textColor}>Slug</Th>
                      <Th color={textColor}>Author</Th>
                      <Th color={textColor}>Published At</Th>
                      <Th color={textColor}>Excerpt</Th>
                      <Th color={textColor}>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {blogPosts.map((post) => (
                      <Tr key={post._id} bg={tableRowBg} borderBottom="1px solid" borderColor={tableBorderColor}>
                        <Td>
                          {post.coverImageUrl && (
                            <Image src={post.coverImageUrl} alt={post.title} boxSize="50px" objectFit="cover" borderRadius="md" />
                          )}
                        </Td>
                        <Td>{post.title}</Td>
                        <Td>{post.slug?.current}</Td>
                        <Td>{post.author || 'N/A'}</Td>
                        <Td>{formatDateTime(post.publishedAt || '')}</Td>
                        <Td>{post.excerpt?.substring(0, 50)}...</Td>
                        <Td>
                          <Stack direction="row" spacing={2}>
                            <Button size="xs" colorScheme="blue">Edit</Button>
                            <Button size="xs" colorScheme="red">Delete</Button>
                          </Stack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text>No blog posts found.</Text>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}
