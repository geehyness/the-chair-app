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
  appointmentCount?: number; // NEW: Add appointmentCount property
}

export interface Appointment {
  _id: string;
  customer: { _id: string; name: string; email: string };
  barber: { _id: string; name: string };
  service: { _id: string; name: string; duration: number; price: number };
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface Category {
  _id: string;
  title: string; // This is already the field for the category's name
  slug: { current: string };
  image?: { asset: { _ref: string } };
  imageUrl?: string;
  description?: string;
}

export interface GalleryImage {
  title: string | undefined;
  description: any;
  _id: string;
  caption?: string;
  tags?: string[];
  image: { asset: { _ref: string } };
  imageUrl?: string;
}

export interface Testimonial {
  comment: any;
  _id: string;
  customerName: string;
  quote: string;
  rating: number;
  image?: { asset: { _ref: string } };
  imageUrl?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  author: { _id: string; name: string };
  publishedAt: string;
  body: any; // Portable Text
  coverImage?: { asset: { _ref: string } };
  coverImageUrl?: string;
  excerpt?: string;
}

export interface SiteSettings {
  title: string;
  location: string;
  _id: string;
  siteName: string;
  logo?: { asset: { _ref: string } };
  logoUrl?: string;
  tagline?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: Array<{
    _key: string;
    platform: string;
    url: string;
  }>;
  openingHours?: Array<{
    _key: string;
    day: string;
    hours: string;
  }>;
  coverImage?: { asset: { _ref: string } };
  coverImageUrl?: string;
}

// Function to fetch all dashboard data
async function getDashboardData() {
  const query = groq`
    {
      "barbers": *[_type == "barber"]{
        _id,
        name,
        slug,
        image,
        bio,
        dailyAvailability[]{
          _key,
          dayOfWeek,
          startTime,
          endTime
        }
      } | order(name asc),
      "services": *[_type == "service"]{
        _id,
        name,
        description,
        duration,
        price,
        slug,
        category->{_id, title},
        barbers[]->{_id, name},
        image
      } | order(name asc),
      "customers": *[_type == "customer"]{
        _id,
        name,
        email,
        phone,
        loyaltyPoints,
        notes,
        "appointmentCount": count(*[_type == "appointment" && customer._ref == ^._id]), // NEW: Calculate appointment count
      } | order(name asc),
      "appointments": *[_type == "appointment"]{
        _id,
        customer->{_id, name, email},
        barber->{_id, name},
        service->{_id, name, duration, price},
        dateTime,
        status,
        notes
      } | order(dateTime desc),
      "categories": *[_type == "category"]{
        _id,
        title,
        slug,
        image,
        description
      } | order(title asc),
      "galleryImages": *[_type == "galleryImage"]{
        _id,
        caption,
        tags,
        image
      } | order(_createdAt desc),
      "testimonials": *[_type == "testimonial"]{
        _id,
        customerName,
        quote,
        rating,
        image
      } | order(_createdAt desc),
      "blogPosts": *[_type == "blogPost"]{
        _id,
        title,
        slug,
        author->{_id, name},
        publishedAt,
        body,
        coverImage,
        excerpt
      } | order(publishedAt desc),
      "siteSettings": *[_type == "siteSettings"][0]{
        _id,
        siteName,
        logo,
        tagline,
        description,
        address,
        phone,
        email,
        socialLinks,
        openingHours,
        coverImage
      },
    }
  `;

  const data = await client.fetch(query);
  const siteSettings = data.siteSettings || {}; // Ensure siteSettings is not null

  // Helper to map image assets to URLs for any array of items
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