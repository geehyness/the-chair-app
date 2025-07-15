// src/components/BarbersClient.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  SimpleGrid,
  Image,
  Button,
  useColorModeValue,
  useTheme,
  useDisclosure, // Import useDisclosure hook
} from '@chakra-ui/react';
import { urlFor } from '@/lib/sanity'; // Ensure urlFor is imported
import BarberProfileModal from './BarberProfileModal'; // Import the modal component

// Define TypeScript interfaces for data passed to this client component
interface DailyAvailability {
  _key: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: any; // Sanity Image object
  imageUrl?: string; // Derived URL for direct use
  bio?: any; // Portable Text (array of blocks) - ensure this matches BarberProfileModal's expectation
  dailyAvailability?: DailyAvailability[];
}

interface BarbersClientProps {
  barbers: Barber[];
}

export default function BarbersClient({ barbers }: BarbersClientProps) {
  const theme = useTheme();

  // Modal specific state and hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Define colors using theme and useColorModeValue
  const bgPrimary = useColorModeValue(theme.colors.neutral.light['bg-primary'], theme.colors.neutral.dark['bg-primary']);
  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const cardBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const borderColor = useColorModeValue(theme.colors.neutral.light['border-color'], theme.colors.neutral.dark['border-color']);

  // Function to open modal with selected barber
  const handleViewProfile = (barber: Barber) => {
    setSelectedBarber(barber);
    onOpen();
  };

  return (
    <Box bg={bgPrimary} minH="100vh" py={10}>
      <Container maxW="container.xl">
        <Heading as="h1" size="xl" textAlign="center" mb={10} color={textColorPrimary}>
          Our Talented Barbers
        </Heading>

        {barbers && barbers.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {barbers.map((barber) => (
              <Box
                key={barber._id}
                bg={cardBg}
                p={6}
                borderRadius="lg"
                boxShadow="md"
                borderWidth="1px"
                borderColor={borderColor}
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                transition="all 0.2s ease-in-out"
              >
                {barber.imageUrl && ( // Use imageUrl provided by the server component
                  <Image
                    src={barber.imageUrl}
                    alt={barber.name}
                    boxSize="150px"
                    borderRadius="full"
                    objectFit="cover"
                    mb={4}
                    mx="auto"
                  />
                )}
                <Heading as="h3" size="md" mb={2} textAlign="center" color={textColorPrimary}>
                  {barber.name}
                </Heading>
                <Text fontSize="md" color={textColorSecondary} textAlign="center" noOfLines={4} mb={3}> {/* Increased lines for bio */}
                  {typeof barber.bio === 'string'
                    ? barber.bio.substring(0, 50) + (barber.bio.length > 50 ? '...' : '')
                    : 'No bio.'}
                </Text>
                <Flex justify="center" mt={4}>
                  <Button
                    size="sm"
                    colorScheme="brand"
                    variant="outline"
                    onClick={() => handleViewProfile(barber)} // Open the modal
                  >
                    View Profile
                  </Button>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Text color={textColorSecondary} textAlign="center" fontSize="lg">No barbers found at the moment.</Text>
        )}
      </Container>

      {/* Barber Profile Modal */}
      <BarberProfileModal
        isOpen={isOpen}
        onClose={onClose}
        barber={selectedBarber}
      />
    </Box>
  );
}