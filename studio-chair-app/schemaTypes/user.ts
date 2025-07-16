// schemas/user.js
export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    {
      name: 'username',
      title: 'Username',
      type: 'string',
      validation: Rule => Rule.required().unique(),
      description: 'Unique identifier for the user. This can be a chosen username.',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email().unique(),
      description: 'User\'s email address. Used for communication.',
    },
    {
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
      description: 'User\'s phone number.',
    },
    {
      name: 'password',
      title: 'Password',
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'User password (IMPORTANT: In a production app, this MUST be hashed before storing!).',
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Admin', value: 'admin' },
          { title: 'Receptionist', value: 'receptionist' },
          { title: 'Barber', value: 'barber' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
      initialValue: 'barber', // Default role
    },
    {
      name: 'barberRef',
      title: 'Associated Barber',
      type: 'reference',
      to: [{ type: 'barber' }],
      hidden: ({ parent }) => parent?.role !== 'barber', // Only show if role is 'barber'
      description: 'Link to the barber document if this user is a barber.',
    },
  ],
  preview: {
    select: {
      title: 'username',
      subtitle: 'role',
    },
  },
};
