// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity'; // Your Sanity client
import { groq } from 'next-sanity';
import bcrypt from 'bcryptjs'; // Import bcryptjs

// Define the salt rounds for bcrypt. Higher is more secure, but slower.
// 10-12 is a good balance for most applications.
const SALT_ROUNDS = 10;

// Helper function to validate email format
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// GET handler: Fetch all users (without passwords)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    let query = groq`
      *[_type == "user"]{
        _id,
        username,
        email,
        phoneNumber,
        role,
        barberRef,
        "barberName": barberRef->name
      }
    `;

    if (userId) {
      query = groq`
        *[_type == "user" && _id == $userId][0]{
          _id,
          username,
          email,
          phoneNumber,
          role,
          barberRef,
          "barberName": barberRef->name
        }
      `;
      const user = await client.fetch(query, { userId });
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    const users = await client.fetch(query);
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('API Error (GET /api/users):', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}

// POST handler: Create a new user
export async function POST(request: Request) {
  try {
    const { username, email, phoneNumber, password, role, barberRef } = await request.json();

    // Basic validation
    if (!username || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Check if user with this email already exists
    const existingUser = await client.fetch(groq`*[_type == "user" && email == $email][0]`, { email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      _type: 'user',
      username,
      email,
      phoneNumber,
      password: hashedPassword, // Store hashed password
      role,
      barberRef: role === 'barber' && barberRef ? barberRef : undefined,
    };

    const createdUser = await writeClient.create(newUser);
    // Return a sanitized version, without the password hash
    const { password: _, ...sanitizedUser } = createdUser;
    return NextResponse.json(sanitizedUser, { status: 201 });
  } catch (error: any) {
    console.error('API Error (POST /api/users):', error);
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}

// PUT handler: Update an existing user
export async function PUT(request: Request) {
  try {
    const { _id, username, email, phoneNumber, password, role, barberRef } = await request.json();

    if (!_id) {
      return NextResponse.json({ message: 'User ID is required for update' }, { status: 400 });
    }
    if (!username || !email || !role) {
      return NextResponse.json({ message: 'Missing required fields for update' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    const patches: { [key: string]: any } = {
      username,
      email,
      phoneNumber: phoneNumber || undefined,
      role,
      barberRef: role === 'barber' && barberRef ? barberRef : null, // Set to null if not barber or no ref
    };

    // If a new password is provided, hash it
    if (password) {
      patches.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updatedUser = await writeClient.patch(_id).set(patches).commit();
    // Return a sanitized version, without the password hash
    const { password: _, ...sanitizedUser } = updatedUser;
    return NextResponse.json(sanitizedUser);
  } catch (error: any) {
    console.error('API Error (PUT /api/users):', error);
    return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
  }
}

// DELETE handler: Delete a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'User ID is required for deletion' }, { status: 400 });
    }

    await writeClient.delete(id);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('API Error (DELETE /api/users):', error);
    return NextResponse.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
  }
}
