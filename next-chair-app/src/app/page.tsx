// src/app/page.tsx
import { client, urlFor } from '@/lib/sanity'; // Import your Sanity client
import { groq } from 'next-sanity';
import { Inter } from 'next/font/google';
import HomePageClient from '@/components/HomePageClient';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'The Chair App',
  description: 'Salon booking made easy',
};

// Define TypeScript interfaces for data fetched by this server component
export interface Barber { // Exported for potential reuse
  _id: string;
  name: string;
  slug: { current: string };
  image?: any;
  bio?: any;
  dailyAvailability?: Array<{
    _key: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface Service { // Exported for potential reuse
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  slug: { current: string };
  image?: any; // ADDED: Sanity Image object
  imageUrl?: string; // ADDED: Derived URL for direct use
  category?: { _id: string; title: string }; // ADDED: Expanded category details
}

export interface SiteSettings { // Exported for potential reuse
  title?: string;
  description?: string;
  coverImage?: any;
  coverImageUrl?: string; // ADDED: Derived URL for direct use
}

// Function to fetch all necessary data on the server
async function getHomePageData(): Promise<{
  barbers: Barber[];
  services: Service[];
  siteSettings: SiteSettings;
}> {
  const query = groq`
    {
      "barbers": *[_type == "barber"]{
        _id,
        name,
        slug,
        image,
        bio,
        dailyAvailability[]{\n          _key,\n          dayOfWeek,\n          startTime,\n          endTime\n        }
      },
      "services": *[_type == "service"] | order(price asc){
        _id,
        name,
        description,
        duration,
        price,
        slug,
        image, // ADDED: Fetch image for services
        category->{_id, title} // ADDED: Fetch category reference
      },
      "siteSettings": *[_type == "siteSettings"][0]{ title, description, coverImage }
    }
  `;
  const data = await client.fetch(query);

  // Ensure siteSettings is an object, even if null from Sanity
  const siteSettings = data.siteSettings || {};

  // Process barbers to include imageUrl
  const processedBarbers = data.barbers.map((barber: Barber) => ({
    ...barber,
    imageUrl: barber.image ? urlFor(barber.image).url() : undefined,
  }));

  // Process services to include imageUrl
  const processedServices = data.services.map((service: Service) => ({
    ...service,
    imageUrl: service.image ? urlFor(service.image).url() : undefined,
  }));


  return {
    barbers: processedBarbers,
    services: processedServices,
    siteSettings: {
      ...siteSettings,
      coverImageUrl: siteSettings.coverImage ? urlFor(siteSettings.coverImage).url() : undefined,
    },
  };
}

export default async function Page() {
  const { barbers, services, siteSettings } = await getHomePageData();

  return (
    <HomePageClient
      barbers={barbers}
      services={services}
      siteSettings={siteSettings}
    />
  );
}
