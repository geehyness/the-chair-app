// src/app/barber-dashboard/manage/page.tsx
// This file was previously src/app/barber-dashboard/page.tsx

import { client, urlFor } from '@/lib/sanity';
import { groq } from 'next-sanity';
import BarberDashboardClient from '@/components/BarberDashboardClient';

// Define and EXPORT interfaces for the data types you'll manage
// These interfaces are exported so BarberDashboardClient can import them for type consistency.
export interface Barber {
  _id: string;
  name: string;
  slug: { current: string };
  image?: { asset: { _ref: string } }; // Sanity image object
  imageUrl?: string; // Derived URL for client
  bio?: any; // Portable Text (array of blocks)
  dailyAvailability?: Array<{
    _key: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  slug: { current: string };
  category?: { _id: string; title: string };
  barbers?: Array<{ _id: string; name: string }>;
  image?: { asset: { _ref: string } };
  imageUrl?: string; // Derived URL for client
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints?: number;
  notes?: string;
}

export interface Appointment {
  _id: string;
  customer: { _id: string; name: string; email: string };
  barber: { _id: string; name: string };
  service: { _id: string; name: string };
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  log?: Array<{
    _key: string;
    timestamp: string;
    type: string;
    message: string;
  }>;
}

export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  image?: { asset: { _ref: string } };
  imageUrl?: string; // Derived URL for client
}

export interface GalleryImage {
  _id: string;
  image?: { asset: { _ref: string } };
  imageUrl?: string; // Derived URL for client
  caption?: string;
  tags?: string[];
  featured?: boolean;
}

export interface Testimonial {
  _id: string;
  customerName: string;
  quote: string;
  rating: number;
  date?: string;
  image?: { asset: { _ref: string } };
  imageUrl?: string; // Derived URL for client
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  content?: any; // Portable Text
  coverImage?: { asset: { _ref: string } };
  coverImageUrl?: string; // Derived URL for client
  author?: string;
  tags?: string[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  _id?: string;
  title?: string;
  description?: string;
  logo?: any;
  logoUrl?: string;
  coverImage?: any;
  coverImageUrl?: string;
  phone?: string;
  email?: string;
  location?: string;
  socialLinks?: SocialLink[];
}


// Function to fetch all necessary data on the server
async function getDashboardData(): Promise<{
  barbers: Barber[];
  services: Service[];
  customers: Customer[];
  appointments: Appointment[];
  categories: Category[];
  galleryImages: GalleryImage[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
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
        dailyAvailability[] {
          _key,
          dayOfWeek,
          startTime,
          endTime
        }
      },
      "services": *[_type == "service"] | order(price asc){
        _id,
        name,
        description,
        duration,
        price,
        slug,
        image, // Fetch image for services
        category->{_id, title}, // Fetch category reference
        barbers[]->{_id, name} // Fetch barbers reference
      },
      "customers": *[_type == "customer"]{
        _id,
        name,
        email,
        phone,
        loyaltyPoints, // Added
        notes // Added
      },
      "appointments": *[_type == "appointment"] | order(dateTime desc){
        _id,
        customer->{_id, name, email},
        barber->{_id, name},
        service->{_id, name},
        dateTime,
        status,
        notes,
        log[]{
          _key,
          timestamp,
          type,
          message,
          user,
          details
        }
      },
      "categories": *[_type == "category"]{
        _id,
        title,
        slug,
        description,
        image // Fetch image for categories
      },
      "galleryImages": *[_type == "galleryImage"]{
        _id,
        image, // Fetch Sanity image object
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
        image // Fetch Sanity image object
      },
      "blogPosts": *[_type == "blogPost"]{
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        content, // Fetch content for blog posts
        coverImage, // Fetch Sanity image object
        author,
        tags
      },
      "siteSettings": *[_type == "siteSettings"][0]{
        _id,
        title,
        description,
        logo, // Fetch Sanity image object
        coverImage, // Fetch Sanity image object
        phone,
        email,
        location,
        socialLinks[]{
          platform,
          url
        }
      }
    }
  `;

  const data = await client.fetch(query);

  // Ensure siteSettings is an object, even if null from Sanity
  const siteSettings = data.siteSettings || {};

  // Map image URLs for client-side components
  const mapImagesToUrls = (items: any[], imageField: string) => {
    return items.map(item => ({
      ...item,
      [imageField + 'Url']: item[imageField] ? urlFor(item[imageField]).url() : undefined
    }));
  };

  return {
    barbers: mapImagesToUrls(data.barbers, 'image') || [],
    services: mapImagesToUrls(data.services, 'image') || [],
    customers: data.customers || [],
    appointments: data.appointments || [],
    categories: mapImagesToUrls(data.categories, 'image') || [],
    galleryImages: mapImagesToUrls(data.galleryImages, 'image') || [],
    testimonials: mapImagesToUrls(data.testimonials, 'image') || [],
    blogPosts: mapImagesToUrls(data.blogPosts, 'coverImage') || [], // Use coverImage for blog posts
    siteSettings: {
      ...siteSettings,
      logoUrl: siteSettings.logo ? urlFor(siteSettings.logo).url() : undefined,
      coverImageUrl: siteSettings.coverImage ? urlFor(siteSettings.coverImage).url() : undefined,
    },
  };
}

export default async function BarberDashboardManagePage() { // Renamed export function
  const { barbers, services, customers, appointments, categories, galleryImages, testimonials, blogPosts, siteSettings } = await getDashboardData();

  return (
    <BarberDashboardClient
      barbers={barbers}
      services={services}
      customers={customers}
      appointments={appointments}
      categories={categories}
      galleryImages={galleryImages}
      testimonials={testimonials}
      blogPosts={blogPosts}
      siteSettings={siteSettings}
    />
  );
}
