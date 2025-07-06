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
} from '@chakra-ui/react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

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

interface HomePageClientProps {
  barbers: Barber[]
  services: Service[]
}

export default function HomePageClient({
  barbers,
  services,
}: HomePageClientProps) {
  return (
    <Box minH="100vh" bg="gray.100" _dark={{ bg: 'gray.900' }}>
      {/* Header */}
      <Flex
        as="header"
        bg="gray.800"
        _dark={{ bg: 'gray.900' }}
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
            The Chair App
          </Heading>
          <Flex as="nav" gap={4}>
            <Link
              as={NextLink}
              href="/"
              _hover={{ color: 'brand.400' }}
              transition="0.2s"
            >
              Home
            </Link>
            <Link
              as={NextLink}
              href="/book"
              _hover={{ color: 'brand.400' }}
            >
              Book Appointment
            </Link>
            <Link
              as={NextLink}
              href="/barber-dashboard"
              _hover={{ color: 'brand.400' }}
            >
              Barber Dashboard
            </Link>
            <Link
              as={NextLink}
              href="/admin-reports"
              _hover={{ color: 'brand.400' }}
            >
              Admin Reports
            </Link>
          </Flex>
        </Container>
      </Flex>

      {/* Hero Section */}
      <Flex
        as="section"
        bgGradient="linear(to-br, brand.500, brand.700)"
        color="white"
        py={20}
        textAlign="center"
        align="center"
        justify="center"
      >
        <Container maxW="container.lg" px={4}>
          <Heading as="h2" size="3xl" mb={4}>
            Your Perfect Cut, Just a Click Away
          </Heading>
          <Text fontSize="xl" mb={8} opacity={0.9}>
            Experience top-notch grooming with our skilled barbers.
          </Text>
          <Button
            as={NextLink}
            href="/book"
            size="lg"
            bg="white"
            color="brand.700"
            _hover={{ bg: 'gray.100' }}
            shadow="lg"
            transition="0.2s"
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
          color="gray.800"
          _dark={{ color: 'gray.100' }}
        >
          Our Services
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {services.length > 0 ? (
            services.map((service) => (
              <Box
                key={service._id}
                bg="white"
                _dark={{ bg: 'gray.800' }}
                rounded="lg"
                shadow="lg"
                p={6}
                border="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.600' }}
                _hover={{ shadow: 'xl' }}
                transition="0.2s"
              >
                <Heading
                  as="h4"
                  size="md"
                  mb={2}
                  color="gray.800"
                  _dark={{ color: 'gray.100' }}
                >
                  {service.name}
                </Heading>
                <Text
                  color="gray.600"
                  _dark={{ color: 'gray.300' }}
                  mb={3}
                >
                  {service.description || 'No description provided.'}
                </Text>
                <Flex justify="space-between">
                  <Text
                    fontWeight="medium"
                    color="gray.800"
                    _dark={{ color: 'gray.100' }}
                  >
                    {service.duration} mins
                  </Text>
                  <Text
                    fontWeight="medium"
                    color="gray.800"
                    _dark={{ color: 'gray.100' }}
                  >
                    R{service.price.toFixed(2)}
                  </Text>
                </Flex>
              </Box>
            ))
          ) : (
            <Text textAlign="center" color="gray.600" _dark={{ color: 'gray.300' }}>
              No services available at the moment. Please check back later!
            </Text>
          )}
        </SimpleGrid>
      </Container>

      {/* Our Barbers Section */}
      <Box as="section" bg="gray.50" _dark={{ bg: 'gray.700' }} py={16} px={4}>
        <Container maxW="container.xl">
          <Heading
            as="h3"
            size="xl"
            textAlign="center"
            mb={12}
            color="gray.800"
            _dark={{ color: 'gray.100' }}
          >
            Meet Our Barbers
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            {barbers.length > 0 ? (
              barbers.map((barber) => (
                <Box
                  key={barber._id}
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  rounded="lg"
                  shadow="lg"
                  overflow="hidden"
                  border="1px"
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.600' }}
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
                      color="gray.800"
                      _dark={{ color: 'gray.100' }}
                    >
                      {barber.name}
                    </Heading>
                    {barber.bio && (
                      <Text
                        color="gray.600"
                        _dark={{ color: 'gray.300' }}
                        fontSize="sm"
                        mb={4}
                        noOfLines={3}
                      >
                        {barber.bio
                          .map((block: any) =>
                            block.children?.map((span: any) => span.text).join('')
                          )
                          .join(' ')}
                      </Text>
                    )}
                    <Link
                      as={NextLink}
                      href={`/barbers/${barber.slug.current}`}
                      color="brand.600"
                      _dark={{ color: 'brand.300' }}
                      fontWeight="medium"
                      _hover={{ color: 'brand.700' }}
                      transition="0.2s"
                    >
                      View Profile & Book
                    </Link>
                  </Box>
                </Box>
              ))
            ) : (
              <Text textAlign="center" color="gray.600" _dark={{ color: 'gray.300' }}>
                No barbers available at the moment. Check back soon!
              </Text>
            )}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" bg="gray.900" color="gray.300" p={6} textAlign="center">
        <Container maxW="container.xl">
          <Text>&copy; {new Date().getFullYear()} The Chair App. All rights reserved.</Text>
        </Container>
      </Box>
    </Box>
  )
}
