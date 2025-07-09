// studio/schemas/blogPost.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: rule => rule.required(),
      description: 'The title of the blog post.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: rule => rule.required(),
      description: 'A unique identifier for the URL (e.g., "my-awesome-post").',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today',
      },
      description: 'The date and time the blog post was published.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'A short summary or preview of the blog post.',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        { type: 'block' }, // Standard block content for rich text
        { type: 'image', options: { hotspot: true } }, // Allow embedding images within content
      ],
      description: 'The main content of the blog post.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true, // Allows cropping and positioning
      },
      description: 'The main image displayed for the blog post.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description: 'The name of the author of the blog post.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'Keywords to categorize the blog post.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishedAt',
      media: 'coverImage',
    },
    prepare(selection) {
      const {title, subtitle, media} = selection
      const date = subtitle ? new Date(subtitle).toLocaleDateString() : 'No publish date';
      return {
        title: title,
        subtitle: `Published: ${date}`,
        media: media,
      }
    },
  },
})
