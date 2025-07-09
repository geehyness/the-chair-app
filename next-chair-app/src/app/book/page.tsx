// the-chair-app/app/book/page.tsx
// REMOVED 'use client' - This is now a Server Component

import { client } from '@/lib/sanity'; // Import your Sanity client
import { groq } from 'next-sanity';
import BookPageClient from '@/components/BookPageClient'; // Import the new client component
import { Metadata } from 'next'; // Import Metadata

// Define TypeScript interfaces for our Sanity data types
// These are exported so the client component can import them
export interface Barber {
  _id: string;
  name: string;
  dailyAvailability: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
  barbers: { _id: string; name: string }[]; // Dereferenced barbers for convenience
}

// Metadata for the /book page
export const metadata: Metadata = {
  title: 'Book Appointment - The Chair App',
  description: 'Schedule your next barber appointment online with ease.',
};

/**
 * Fetches all barbers and services required for the booking form.
 * This is a Server Component, so data fetching happens on the server.
 * @returns A promise that resolves to an object containing barbers and services.
 */
async function getBookingData(): Promise<{ barbers: Barber[]; services: Service[] }> {
  try {
    const barbersQuery = groq`*[_type == "barber"]{
      _id,
      name,
      dailyAvailability // Fetch the granular availability field
    }`;
    const servicesQuery = groq`*[_type == "service"]{
      _id,
      name,
      duration,
      price,
      barbers[]->{_id, name} // Dereference barbers to get their IDs and names
    }`;

    const [barbers, services] = await Promise.all([
      client.fetch(barbersQuery),
      client.fetch(servicesQuery)
    ]);

    return { barbers, services };
  } catch (error: any) {
    console.error('Booking Page: Error fetching booking data:', { message: error.message, stack: error.stack });
    return { barbers: [], services: [] }; // Return empty arrays on error
  }
}

// Main Booking Page component (Server Component)
export default async function BookPage() {
  const { barbers, services } = await getBookingData();

  return (
    <BookPageClient
      barbers={barbers}
      services={services}
    />
  );
}
