// studio/schemas/blogPost.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: rule => rule.required() }),
    defineField({ name: 'publishedAt', type: 'datetime' }),
    defineField({ name: 'excerpt', type: 'text' }),
    defineField({ name: 'content', type: 'array', of: [{type: 'block'}] }),
    defineField({ name: 'coverImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'author', type: 'string' }),
  ],
})
