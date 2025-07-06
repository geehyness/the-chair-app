// src/lib/sanity.ts
import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Configure your Sanity client
export const client = createClient({
  // Replace with your Sanity project ID
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'YOUR_SANITY_PROJECT_ID',
  // Replace with your Sanity dataset name (e.g., 'production' or 'development')
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  // Use the latest API version
  apiVersion: '2023-05-03', // Use a stable API version
  // Set to true to use a CDN for faster content delivery, false for fresh data
  useCdn: true,
});

// Helper function for generating image URLs from Sanity image assets
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// You can also export a logger if you plan to use sanityLogger.ts
// For now, we'll keep it simple.
// import { SanityLogger } from './sanityLogger';
// export const logger = new SanityLogger(client);
