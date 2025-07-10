// src/lib/sanity.ts
import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Configure your Sanity client for read operations (default for frontend)
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'YOUR_SANITY_PROJECT_ID',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: true, // Use CDN for faster reads on the client
  token: process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN
});

// Helper function for generating image URLs
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Client for write operations (used in API routes)
// It's important that SANITY_API_TOKEN is set as an environment variable in your deployment
// and in .env.local for development. This token must have write permissions.
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'YOUR_SANITY_PROJECT_ID',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false, // Ensure fresh data and write capabilities
  token: process.env.NEXT_PUBLIC_SANITY_API_WRITE_TOKEN, // <--- IMPORTANT: Sanity API Token with write access
});

// You can also export a logger if you plan to use sanityLogger.ts
// import { SanityLogger } from './sanityLogger';
// export const logger = new SanityLogger(client);