'useclient'

import NextLink from 'next/link'; // Use NextLink for internal routing
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
// import { logger } from '@/lib/logger';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Link,
  SimpleGrid,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import Image from 'next/image'; // Next.js Image component
import { urlFor } from '@/lib/sanity'; // Import urlFor for image handling
import HomePageClient from '@/components/HomePageClient';

// Define TypeScript interfaces for our Sanity data types
interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: any; // Sanity image asset type
  bio?: any; // Portable Text array
}

interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

async function getHomePageData(): Promise<{ barbers: Barber[]; services: Service[] }> {
  const query = groq`
    {
      "barbers": *[_type == "barber"]{ _id, name, slug, image, bio },
      "services": *[_type == "service"] | order(price asc){ _id, name, description, duration, price }
    }
  `
  const data = await client.fetch(query)
  return data
}

export default async function Page() {
  const { barbers, services } = await getHomePageData()
  return <HomePageClient barbers={barbers} services={services} />
}
