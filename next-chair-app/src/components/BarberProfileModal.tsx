import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Image,
  VStack,
  Box,
  Flex,
  useColorModeValue,
  useTheme,
  Tag, // Import Tag for displaying availability blocks
  TagLabel,
  Heading,
} from '@chakra-ui/react';
import { urlFor } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';

// Define the interface for DailyAvailability matching your Sanity schema
interface DailyAvailability {
  _key: string; // Sanity automatically adds _key for array items
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: any;
  bio?: any; // Portable Text (array of blocks)
  dailyAvailability?: DailyAvailability[]; // Add dailyAvailability
}

interface BarberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  barber: Barber | null;
}

const components = {
  block: {
    normal: ({ children }: { children: React.ReactNode }) => <Text mb={2}>{children}</Text>,
  },
  // You can add custom components for lists, marks, etc., here if your Portable Text contains them
};

export default function BarberProfileModal({ isOpen, onClose, barber }: BarberProfileModalProps) {
  const theme = useTheme();

  const textColorPrimary = useColorModeValue(theme.colors.neutral.light['text-primary'], theme.colors.neutral.dark['text-primary']);
  const textColorSecondary = useColorModeValue(theme.colors.neutral.light['text-secondary'], theme.colors.neutral.dark['text-secondary']);
  const modalBg = useColorModeValue(theme.colors.neutral.light['bg-card'], theme.colors.neutral.dark['bg-card']);
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const footerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const tagBg = useColorModeValue(theme.colors.brand['100'], theme.colors.brand['700']);
  const tagColor = useColorModeValue(theme.colors.brand['800'], 'whiteAlpha.900');


  if (!barber) {
    return null;
  }

  // Group availability by day for easier display
  const groupedAvailability: { [key: string]: DailyAvailability[] } = {};
  barber.dailyAvailability?.forEach(block => {
    const day = block.dayOfWeek.charAt(0).toUpperCase() + block.dayOfWeek.slice(1);
    if (!groupedAvailability[day]) {
      groupedAvailability[day] = [];
    }
    groupedAvailability[day].push(block);
  });

  const sortedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="lg" overflow="hidden">
        <ModalHeader borderBottomWidth="1px" borderColor={headerBorderColor} color={textColorPrimary}>
          {barber.name}
        </ModalHeader>
        <ModalCloseButton color={textColorPrimary} />
        <ModalBody p={6}>
          <VStack spacing={4} align="center">
            {barber.image && (
              <Image
                src={urlFor(barber.image).width(200).height(200).url()}
                alt={barber.name}
                boxSize="150px"
                borderRadius="full"
                objectFit="cover"
                mb={4}
              />
            )}
            <Box textAlign="center">
              <Text fontSize="xl" fontWeight="bold" color={textColorPrimary}>{barber.name}</Text>
              {barber.bio && (
                <Box mt={4} color={textColorSecondary} textAlign="center">
                  <Heading as="h4" size="md" mb={2} color={textColorPrimary}>About {barber.name}</Heading>
                  <PortableText value={barber.bio} components={components} />
                </Box>
              )}

              {/* Display Daily Availability */}
              {barber.dailyAvailability && barber.dailyAvailability.length > 0 && (
                <Box mt={6} width="100%">
                  <Heading as="h4" size="md" mb={3} color={textColorPrimary} textAlign="center">
                    Availability
                  </Heading>
                  <VStack align="flex-start" spacing={2}>
                    {sortedDays.map(day => {
                      const availabilityForDay = groupedAvailability[day];
                      if (availabilityForDay && availabilityForDay.length > 0) {
                        return (
                          <Flex key={day} direction={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} width="100%" px={2}>
                            <Text fontWeight="semibold" minW="80px" color={textColorPrimary} mb={{ base: 1, sm: 0 }}>
                              {day}:
                            </Text>
                            <Flex wrap="wrap" ml={{ base: 0, sm: 2 }}>
                              {availabilityForDay
                                .sort((a, b) => a.startTime.localeCompare(b.startTime)) // Sort time blocks
                                .map(block => (
                                <Tag
                                  key={block._key}
                                  size="md"
                                  variant="solid"
                                  bg={tagBg}
                                  color={tagColor}
                                  borderRadius="full"
                                  mr={2}
                                  mb={2}
                                >
                                  <TagLabel>{block.startTime} - {block.endTime}</TagLabel>
                                </Tag>
                              ))}
                            </Flex>
                          </Flex>
                        );
                      }
                      return (
                        <Flex key={day} direction={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} width="100%" px={2}>
                          <Text fontWeight="semibold" minW="80px" color={textColorPrimary} mb={{ base: 1, sm: 0 }}>
                            {day}:
                          </Text>
                          <Text fontStyle="italic" color={textColorSecondary}>Unavailable</Text>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={footerBorderColor}>
          <Button colorScheme="brand" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}