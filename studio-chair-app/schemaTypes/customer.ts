// studio/schemas/customer.js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'customer',
  title: 'Customer',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Customer\'s full name.',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.required().email(),
      description: 'Customer\'s email address. Used for contact and unique identification.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Customer\'s phone number.',
    }),
    defineField({
      name: 'loyaltyPoints',
      title: 'Loyalty Points',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.min(0),
      description: 'Accumulated loyalty points for the customer.',
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      description: 'Any internal notes about the customer (e.g., preferences, history).',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      phone: 'phone',
      loyaltyPoints: 'loyaltyPoints',
    },
    prepare(selection) {
      const {title, subtitle, phone, loyaltyPoints} = selection;
      return {
        title: title,
        subtitle: `${subtitle} ${phone ? `(${phone})` : ''} - Points: ${loyaltyPoints || 0}`,
      };
    },
  },
})
