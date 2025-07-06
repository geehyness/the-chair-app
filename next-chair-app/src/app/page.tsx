// src/app/page.tsx
import { client } from '@/lib/sanity'; // Import your Sanity client
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
interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: any;
  bio?: any;
}

interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

interface SiteSettings {
  title?: string;
  description?: string;
  coverImage?: any;
}

// Function to fetch all necessary data on the server
async function getHomePageData(): Promise<{
  barbers: Barber[];
  services: Service[];
  siteSettings: SiteSettings; // Still typed as SiteSettings, but we'll ensure it's an object
}> {
  const query = groq`
    {
      "barbers": *[_type == "barber"]{ _id, name, slug, image, bio },
      "services": *[_type == "service"] | order(price asc){ _id, name, description, duration, price },
      "siteSettings": *[_type == "siteSettings"][0]{ title, description, coverImage }
    }
  `;
  const data = await client.fetch(query);

  // Ensure siteSettings is an object, even if null from Sanity
  const siteSettings = data.siteSettings || {};

  return {
    barbers: data.barbers,
    services: data.services,
    siteSettings: siteSettings,
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
