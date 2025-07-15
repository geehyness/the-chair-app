// src/app/not-found.tsx
'use client'; // Add this directive at the very top

import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';

export default function NotFound() {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const buttonScheme = 'brand';

  return (
    <Flex
      minH="100vh"
      direction="column"
      align="center"
      justify="center"
      bg={bgColor}
      color={textColor}
      textAlign="center"
      p={8}
    >
      <div className="barber-pole-container">
        <div className="barber-pole-ceiling">
          <div className="barber-pole-screw top-left"></div>
          <div className="barber-pole-screw top-right"></div>
        </div>
        <div className="barber-pole-mount"></div>
        <div className="barber-pole"></div>
      </div>
      <Heading as="h1" size="2xl" mt={8} mb={4}>
        404 - Page Not Found
      </Heading>
      <Text fontSize="xl" mb={6}>
        Oops! It looks like this page got a bad cut.
      </Text>
      <Box mb={8}>
        <Text fontSize="md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Perhaps our barbers are busy perfecting someone&apos;s look!
        </Text>
      </Box>
      <Link href="/" passHref>
        <Button colorScheme={buttonScheme} size="lg">
          Go Back Home
        </Button>
      </Link>
    </Flex>
  );
}