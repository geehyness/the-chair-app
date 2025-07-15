// src/app/barbers/page.tsx
import { client, urlFor } from '@/lib/sanity'; // Import your Sanity client and urlFor
import { groq } from 'next-sanity';
import BarbersClient from '@/components/BarbersClient'; // Import the client component we'll create
import { Metadata } from 'next';

// Define the TypeScript interface for DailyAvailability
interface DailyAvailability {
  _key: string; // Add the missing _key property
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

// Define the TypeScript interface for a Barber object as fetched from Sanity
interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: any; // Sanity Image object
  bio?: any; // Sanity Portable Text (can be array of blocks or string)
  dailyAvailability?: DailyAvailability[]; // Use the defined DailyAvailability interface
}

// Metadata for the /barbers page (server-only export)
export const metadata: Metadata = {
  title: 'Our Barbers - The Chair App',
  description: 'Meet the talented team of professional barbers at The Chair App. View their profiles, specialties, and availability.',
};

// Function to fetch all barber data from Sanity
async function getBarbersData(): Promise<Barber[]> {
  const query = groq`
    *[_type == "barber"]{
      _id,
      name,
      slug,
      image,
      bio, // Keep bio as is (Portable Text array)
      dailyAvailability[]{ // Fetch dailyAvailability with its sub-fields
        _key,
        dayOfWeek,
        startTime,
        endTime
      }
    } | order(name asc) // Order barbers by name for consistent display
  `;
  const barbers = await client.fetch(query);
  return barbers;
}

// Server component to fetch data and pass it to the client component
export default async function BarbersPage() {
  const barbers = await getBarbersData();

  // Process barber data for the client component, especially images
  // Do NOT convert bio to string here, let BarberProfileModal handle Portable Text
  const processedBarbers = barbers.map(barber => ({
    ...barber,
    // Generate image URL for direct use in the client component
    imageUrl: barber.image ? urlFor(barber.image).url() : undefined,
    // bio is now passed as the original Portable Text array
  }));

  return (
    <BarbersClient barbers={processedBarbers} />
  );
}