// src/components/HomePageClient.tsx
'use client'

import React from 'react'
import NextLink from 'next/link'
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Link,
  SimpleGrid,
  Container,
  // Removed: useColorModeValue
  Spinner,
  Center,
} from '@chakra-ui/react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { PortableText } from '@portabletext/react';

// Define TypeScript interfaces for our Sanity data types
interface Barber {
  _id: string
  name: string
  slug: { current: string }
  image?: any
  bio?: any
}

interface Service {
  _id: string
  name: string
  description?: string
  duration: number
  price: number
}

interface SiteSettings {
  title?: string;
  description?: string;
  coverImage?: any;
}

interface HomePageClientProps {
  barbers: Barber[]
  services: Service[]
  siteSettings: SiteSettings;
}

export default function HomePageClient({
  barbers,
  services,
  siteSettings,
}: HomePageClientProps) {
  // Static color values to avoid useColorModeValue error
  const bgColor = 'gray.800'; // Dark background
  const headerBg = 'gray.900'; // Even darker header
  const headerColor = 'white';
  const linkHoverColor = 'purple.400';
  const heroGradientStart = 'purple.700';
  const heroGradientEnd = 'purple.900';
  const heroButtonBg = 'gray.100';
  const heroButtonColor = 'purple.900';
  const sectionHeadingColor = 'gray.100';
  const cardBg = 'gray.800';
  const cardBorderColor = 'gray.600';
  const cardHeadingColor = 'gray.100';
  const cardTextColor = 'gray.300';
  const footerBg = 'gray.900';
  const footerColor = 'gray.300';

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Flex
        as="header"
        bg={headerBg}
        color={headerColor}
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
            {siteSettings.title || 'The Chair App'}
          </Heading>
          <Flex as="nav" gap={4}>
            <Link
              as={NextLink}
              href="/"
              _hover={{ color: linkHoverColor }}
              transition="0.2s"
            >
              Home
            </Link>
            <Link
              as={NextLink}
              href="/book"
              _hover={{ color: linkHoverColor }}
            >
              Book Appointment
            </Link>
            <Link
              as={NextLink}
              href="/barber-dashboard"
              _hover={{ color: linkHoverColor }}
            >
              Barber Dashboard
            </Link>
            <Link
              as={NextLink}
              href="/admin-reports"
              _hover={{ color: linkHoverColor }}
            >
              Admin Reports
            </Link>
          </Flex>
        </Container>
      </Flex>

      {/* Hero Section */}
      <Flex
        as="section"
        bgGradient={`linear(to-br, ${heroGradientStart}, ${heroGradientEnd})`}
        color="white"
        py={20}
        textAlign="center"
        align="center"
        justify="center"
        position="relative"
        overflow="hidden"
      >
        {siteSettings.coverImage && (
          <Image
            src={urlFor(siteSettings.coverImage).url()}
            alt={siteSettings.title || "Barbershop Cover"}
            layout="fill"
            objectFit="cover"
            quality={90}
            priority
            style={{ zIndex: 0 }}
          />
        )}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex="1"
        />
        <Container maxW="container.lg" px={4} zIndex="2">
          <Heading as="h2" size="3xl" mb={4}>
            {siteSettings.description || 'Your Perfect Cut, Just a Click Away'}
          </Heading>
          <Text fontSize="xl" mb={8} opacity={0.9}>
            Experience top-notch grooming with our skilled barbers.
          </Text>
          <Button
            as={NextLink}
            href="/book"
            size="lg"
            bg={heroButtonBg}
            color={heroButtonColor}
            _hover={{ bg: 'gray.200' }}
            shadow="lg"
            transition="0.2s"
            rounded="full"
          >
            Book Your Appointment Now!
          </Button>
        </Container>
      </Flex>

      {/* Services Section */}
      <Container as="section" maxW="container.xl" py={16} px={4}>
        <Heading
          as="h3"
          size="xl"
          textAlign="center"
          mb={12}
          color={sectionHeadingColor}
        >
          Our Services
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {services.length > 0 ? (
            services.map((service) => (
              <Box
                key={service._id}
                bg={cardBg}
                rounded="lg"
                shadow="lg"
                p={6}
                border="1px"
                borderColor={cardBorderColor}
                _hover={{ shadow: 'xl' }}
                transition="0.2s"
              >
                <Heading
                  as="h4"
                  size="md"
                  mb={2}
                  color={cardHeadingColor}
                >
                  {service.name}
                </Heading>
                <Text
                  color={cardTextColor}
                  mb={3}
                >
                  {service.description || 'No description provided.'}
                </Text>
                <Flex justify="space-between" align="center">
                  <Text
                    fontWeight="medium"
                    color={cardHeadingColor}
                  >
                    {service.duration} mins
                  </Text>
                  <Text
                    fontWeight="medium"
                    color={cardHeadingColor}
                  >
                    R{service.price.toFixed(2)}
                  </Text>
                </Flex>
                <Button
                  as={NextLink}
                  href="/book"
                  mt={4}
                  colorScheme="purple"
                  rounded="full"
                  _hover={{ bg: 'purple.700' }}
                >
                  Book This Service
                </Button>
              </Box>
            ))
          ) : (
            <Text textAlign="center" color={cardTextColor}>
              No services available at the moment. Please check back later!
            </Text>
          )}
        </SimpleGrid>
      </Container>

      {/* Our Barbers Section */}
      <Box as="section" bg={'gray.700'} py={16} px={4}> {/* Static gray.700 for this section */}
        <Container maxW="container.xl">
          <Heading
            as="h3"
            size="xl"
            textAlign="center"
            mb={12}
            color={sectionHeadingColor}
          >
            Meet Our Barbers
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            {barbers.length > 0 ? (
              barbers.map((barber) => (
                <Box
                  key={barber._id}
                  bg={cardBg}
                  rounded="lg"
                  shadow="lg"
                  overflow="hidden"
                  border="1px"
                  borderColor={cardBorderColor}
                  _hover={{ shadow: 'xl' }}
                  transition="0.2s"
                >
                  {barber.image && (
                    <Box h="250px" overflow="hidden" position="relative">
                      <Image
                        src={urlFor(barber.image).width(400).height(400).url()}
                        alt={barber.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  <Box p={6} textAlign="center">
                    <Heading
                      as="h4"
                      size="md"
                      mb={2}
                      color={cardHeadingColor}
                    >
                      {barber.name}
                    </Heading>
                    {barber.bio && (
                      <Text
                        color={cardTextColor}
                        fontSize="sm"
                        mb={4}
                        noOfLines={3}
                      >
                        <PortableText value={barber.bio} />
                      </Text>
                    )}
                    <Link
                      as={NextLink}
                      href={`/barbers/${barber.slug.current}`}
                      color="purple.300" // Static purple.300
                      fontWeight="medium"
                      _hover={{ color: 'purple.400' }}
                      transition="0.2s"
                    >
                      View Profile & Book
                    </Link>
                  </Box>
                </Box>
              ))
            ) : (
              <Text textAlign="center" color={cardTextColor}>
                No barbers available at the moment. Check back soon!
              </Text>
            )}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" bg={footerBg} color={footerColor} p={6} textAlign="center">
        <Container maxW="container.xl">
          <Text>&copy; {new Date().getFullYear()} {siteSettings.title || 'The Chair App'}. All rights reserved.</Text>
        </Container>
      </Box>
    </Box>
  )
}
