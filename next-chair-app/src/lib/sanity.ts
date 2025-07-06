// the-chair-app/lib/sanity.ts
import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Sanity client configuration
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, // Your Sanity project ID from .env.local
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,     // Your Sanity dataset name from .env.local
  apiVersion: '2024-01-01',                             // Use a recent date for API version
  useCdn: true,                                         // Set to true for cached data, false for fresh data (e.g., during development)
});

// Image URL builder for Sanity images
const builder = imageUrlBuilder(client);

/**
 * Helper function to generate image URLs from Sanity image assets.
 * @param source The Sanity image asset object.
 * @returns A URL string for the image.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
