// src/app/services/page.tsx
import { client, urlFor } from '@/lib/sanity';
import { groq } from 'next-sanity';
import ServicesClient from '@/components/ServicesClient'; // Import the client component
import { Metadata } from 'next';

// Define TypeScript interfaces for data fetched by this server component
export interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  slug: { current: string };
  image?: any; // Sanity Image object
  imageUrl?: string; // Derived URL for direct use
  category?: {
    _id: string;
    title: string;
  };
  barbers?: Array<{
    _id: string;
    name: string;
  }>;
}

export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  image?: any; // Sanity Image object
  imageUrl?: string; // Derived URL for direct use
}

// Metadata for the /services page (server-only export)
export const metadata: Metadata = {
  title: 'Our Services - The Chair App',
  description: 'Explore the wide range of professional barbering services offered at The Chair App. Find your perfect cut, shave, or style.',
};

// Function to fetch all service and category data from Sanity
async function getServicesData(): Promise<{ services: Service[]; categories: Category[] }> {
  const query = groq`
    {
      "services": *[_type == "service"]{
        _id,
        name,
        description,
        duration,
        price,
        slug,
        image,
        category->{_id, title}, // Fetch category reference
        barbers[]->{_id, name} // Fetch barbers reference
      } | order(name asc), // Order services by name

      "categories": *[_type == "category"]{
        _id,
        title,
        slug,
        description,
        image
      } | order(title asc) // Order categories by title
    }
  `;
  const data = await client.fetch(query);

  // Process services to include imageUrl
  const processedServices = data.services.map((service: Service) => ({
    ...service,
    imageUrl: service.image ? urlFor(service.image).url() : undefined,
  }));

  // Process categories to include imageUrl
  const processedCategories = data.categories.map((category: Category) => ({
    ...category,
    imageUrl: category.image ? urlFor(category.image).url() : undefined,
  }));

  return {
    services: processedServices,
    categories: processedCategories,
  };
}

// Server component to fetch data and pass it to the client component
export default async function ServicesPage() {
  const { services, categories } = await getServicesData();

  return (
    <ServicesClient services={services} categories={categories} />
  );
}
