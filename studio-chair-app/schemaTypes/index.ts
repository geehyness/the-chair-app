// studio/schemas/index.ts
import service from './service'
import customer from './customer'
import barber from './barber'
import appointment from './appointment'
import category from './category'
import galleryImage from './galleryImage'
import testimonial from './testimonial'
import siteSettings from './siteSettings'
import blogPost from './blogPost'
import logEntry from './logEntry' // Import logEntry

export const schemaTypes = [
  service,
  customer,
  barber,
  appointment,
  category,
  galleryImage,
  testimonial,
  siteSettings,
  blogPost,
  logEntry, // Add logEntry to the schemaTypes array
]