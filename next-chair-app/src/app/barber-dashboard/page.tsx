// src/app/barber-dashboard/page.tsx
import { client } from '@/lib/sanity';
import { groq } from 'next-sanity';
import BarberDashboardClient from '@/components/BarberDashboardClient';

// Define interfaces for the data types you'll manage
interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: any;
  bio?: any;
  dailyAvailability?: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: { _ref: string }; // Reference to category
  barbers?: Array<{ _ref: string }>; // References to barbers
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Appointment {
  _id: string;
  customer: { _id: string; name: string; email: string }; // Expanded customer details
  barber: { _id: string; name: string }; // Expanded barber details
  service: { _id: string; name: string }; // Expanded service details
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  log?: any[]; // Array of logEntry objects
}

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  image?: any;
}

interface GalleryImage {
  _id: string;
  image: any;
  caption?: string;
  tags?: string[];
  featured: boolean;
}

interface Testimonial {
  _id: string;
  customerName: string;
  quote: string;
  rating: number;
  date?: string;
  image?: any;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  content?: any[];
  coverImage?: any;
  author?: string;
}

// Function to fetch all data for the dashboard
async function getDashboardData() {
  const query = groq`
    {
      "barbers": *[_type == "barber"]{
        _id,
        name,
        slug,
        "imageUrl": image.asset->url, // Fetch image URL directly
        bio,
        dailyAvailability
      },
      "services": *[_type == "service"]{
        _id,
        name,
        description,
        duration,
        price,
        category->{_id, title}, // Fetch category title
        barbers[]->{_id, name} // Fetch barber names
      },
      "customers": *[_type == "customer"]{
        _id,
        name,
        email,
        phone
      },
      "appointments": *[_type == "appointment"]{
        _id,
        dateTime,
        status,
        notes,
        log,
        customer->{_id, name, email}, // Fetch customer details
        barber->{_id, name}, // Fetch barber details
        service->{_id, name} // Fetch service details
      },
      "categories": *[_type == "category"]{
        _id,
        title,
        slug,
        description,
        "imageUrl": image.asset->url
      },
      "galleryImages": *[_type == "galleryImage"]{
        _id,
        "imageUrl": image.asset->url,
        caption,
        tags,
        featured
      },
      "testimonials": *[_type == "testimonial"]{
        _id,
        customerName,
        quote,
        rating,
        date,
        "imageUrl": image.asset->url
      },
      "blogPosts": *[_type == "blogPost"]{
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        "coverImageUrl": coverImage.asset->url,
        author
      }
    }
  `;

  const data = await client.fetch(query);
  return data;
}

export default async function BarberDashboardPage() {
  const data = await getDashboardData();

  return (
    <BarberDashboardClient
      barbers={data.barbers || []}
      services={data.services || []}
      customers={data.customers || []}
      appointments={data.appointments || []}
      categories={data.categories || []}
      galleryImages={data.galleryImages || []}
      testimonials={data.testimonials || []}
      blogPosts={data.blogPosts || []}
    />
  );
}
