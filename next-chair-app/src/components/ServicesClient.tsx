// src/components/ServicesClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  SimpleGrid,
  Image,
  Button,
  VStack,
  HStack,
  Input,
  Select,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageTransition } from './PageTransitionProvider';

// Import the interfaces from the server component to ensure type consistency
import type { Service, Category } from '@/app/services/page';

interface ServicesClientProps {
  services: Service[];
  categories: Category[];
}

export default function ServicesClient({ services, categories }: ServicesClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const { startTransition } = usePageTransition();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // Stores category _id

  // Define colors using theme and useColorModeValue
  const bgPrimary = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);
  const inputBg = useColorModeValue(theme.colors.neutral.light['bg-input'], theme.colors.neutral.dark['bg-input']);
  const inputBorder = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);

  // Memoize filtered services to optimize performance
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(service => service.category?._id === selectedCategory);
    }

    // Filter by search term (case-insensitive)
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          service.description?.toLowerCase().includes(lowerCaseSearchTerm) ||
          service.category?.title.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    return filtered;
  }, [services, selectedCategory, searchTerm]);

  return (
    <Box bg={bgPrimary} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Heading as="h1" size="xl" textAlign="center" mb={8} color={textColorPrimary}>
          Our Services
        </Heading>

        {/* Search and Filter Section */}
        <VStack spacing={4} mb={8} align="stretch">
          <Input
            placeholder="Search services by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            color={textColorPrimary}
            _placeholder={{ color: textColorSecondary }}
            size="lg"
            borderRadius="md"
          />
          <Select
            placeholder="Filter by Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            color={textColorPrimary}
            size="lg"
            borderRadius="md"
          >
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.title}
              </option>
            ))}
          </Select>
        </VStack>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {filteredServices.map((service) => (
              <Flex
                key={service._id}
                bg={cardBg}
                p={6}
                borderRadius="lg"
                boxShadow="md"
                borderWidth="1px"
                borderColor={borderColor}
                direction="column"
                justify="space-between"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                transition="all 0.2s ease-in-out"
              >
                {service.imageUrl && (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    boxSize="150px"
                    objectFit="cover"
                    borderRadius="md"
                    mb={4}
                    mx="auto"
                  />
                )}
                <Box>
                  <Heading as="h3" size="md" mb={2} color={textColorPrimary}>
                    {service.name}
                  </Heading>
                  {service.category && (
                    <Text fontSize="sm" color={theme.colors.brand['400']} mb={1}>
                      Category: {service.category.title}
                    </Text>
                  )}
                  <Text fontSize="md" color={textColorSecondary} mb={3} noOfLines={3}>
                    {service.description}
                  </Text>
                </Box>
                <Flex justify="space-between" align="center" mt={4}>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color={theme.colors.brand['500']}>
                      ${service.price.toFixed(2)}
                    </Text>
                    <Text fontSize="sm" color={textColorSecondary}>
                      Duration: {service.duration} mins
                    </Text>
                  </VStack>
                  <Button
                    as={NextLink}
                    href={`/book-service/${service.slug?.current}`}
                    size="md"
                    colorScheme="brand"
                    onClick={(e) => {
                      e.preventDefault();
                      startTransition();
                      setTimeout(() => router.push(`/book-service/${service.slug?.current}`), 400);
                    }}
                  >
                    Book Now
                  </Button>
                </Flex>
              </Flex>
            ))}
          </SimpleGrid>
        ) : (
          <Text color={textColorSecondary} textAlign="center" py={10} fontSize="lg">
            No services found matching your criteria.
          </Text>
        )}
      </Container>
    </Box>
  );
}
