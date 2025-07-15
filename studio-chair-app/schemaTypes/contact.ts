// studio/schemas/contact.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contact',
  title: 'Contact Message',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Sender Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The full name of the person who sent the message.',
    }),
    defineField({
      name: 'email',
      title: 'Sender Email',
      type: 'string',
      validation: (rule) => rule.required().email(),
      description: 'The email address of the sender.',
    }),
    defineField({
      name: 'phone',
      title: 'Sender Phone (Optional)',
      type: 'string',
      description: 'The phone number of the sender, if provided.',
    }),
    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The subject line of the contact message.',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
      description: 'The full content of the message.',
    }),
    defineField({
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
      description: 'The date and time the message was sent.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'In Progress', value: 'inProgress'},
          {title: 'Resolved', value: 'resolved'},
          {title: 'Spam', value: 'spam'},
        ],
        layout: 'radio',
      },
      initialValue: 'new',
      validation: (rule) => rule.required(),
      description: 'The current handling status of the contact message.',
    }),
    defineField({
      name: 'resolutionNotes',
      title: 'Resolution Notes (Internal)',
      type: 'text',
      rows: 3,
      description: 'Internal notes about how the message was resolved or followed up.',
      hidden: ({parent}) => parent?.status !== 'resolved',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      subject: 'subject',
      sentAt: 'sentAt',
      status: 'status', // Make sure 'status' is selected here
    },
    prepare(selection) {
      const {name, subject, sentAt, status} = selection;
      const formattedDate = sentAt ? new Date(sentAt).toLocaleDateString() : 'N/A';

      // Define the map with explicit string literal types for keys
      const statusEmojiMap: { [key: string]: string } = {
        'new': '✉️',
        'inProgress': '✍️',
        'resolved': '✅',
        'spam': '🗑️',
      };

      // Safely access the emoji, ensuring 'status' is treated as a string and has a corresponding key
      const statusEmoji = (typeof status === 'string' && statusEmojiMap[status])
        ? statusEmojiMap[status]
        : '❓'; // Default emoji if status is not found or not a string

      return {
        title: `${name} - ${subject}`,
        subtitle: `${formattedDate} | Status: ${statusEmoji} ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}`,
      };
    },
  },
})