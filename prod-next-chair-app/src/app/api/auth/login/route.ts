// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity'; // Your Sanity client
import { groq } from 'next-sanity';
import bcrypt from 'bcryptjs'; // Import bcryptjs

// Admin credentials from environment variables (server-side)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@thechairapp';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default_admin_password'; // This should be the plaintext password for comparison

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Handle hardcoded admin login first
    if (email === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) { // Direct comparison for hardcoded admin
        return NextResponse.json({
          user: {
            username: 'Admin User',
            email: ADMIN_EMAIL,
            role: 'admin',
            phoneNumber: undefined, // Admin doesn't have a phone number in this context
          },
          message: 'Admin login successful'
        }, { status: 200 });
      } else {
        return NextResponse.json({ message: 'Invalid admin credentials' }, { status: 401 });
      }
    }

    // For other users, fetch from Sanity
    const userDoc = await client.fetch(groq`
      *[_type == "user" && email == $email][0]{
        _id,
        username,
        email,
        phoneNumber,
        password, // Fetch the hashed password
        role
      }
    `, { email });

    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, userDoc.password);

    if (isPasswordValid) {
      // Return sanitized user data (without password hash)
      const { password: _, ...sanitizedUser } = userDoc;
      return NextResponse.json({ user: sanitizedUser, message: 'Login successful' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('API Error (POST /api/auth/login):', error);
    return NextResponse.json({ message: 'Authentication failed', error: error.message }, { status: 500 });
  }
}
