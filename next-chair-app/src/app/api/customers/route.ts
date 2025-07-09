// src/app/api/customers/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, loyaltyPoints, notes } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ message: 'Missing required fields (name, email)' }, { status: 400 });
    }

    // Check if customer with this email already exists
    const existingCustomer = await client.fetch(groq`*[_type == "customer" && email == $email][0]`, { email });
    if (existingCustomer) {
      return NextResponse.json({ message: 'Customer with this email already exists.' }, { status: 409 });
    }

    const customerDoc = {
      _type: 'customer',
      name,
      email,
      phone: phone || null,
      loyaltyPoints: loyaltyPoints || 0,
      notes: notes || null,
    };

    const newCustomer = await writeClient.create(customerDoc);
    await logSanityInteraction('create', `Created new customer: ${name} (${email})`, 'customer', newCustomer._id, 'admin', true, { payload: customerDoc });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/customers:', error);
    let errorMessage = 'Failed to create customer.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to create customer: ${errorMessage}`, 'customer', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'JSON Body received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    let query = groq`*[_type == "customer"]{
      _id,
      name,
      email,
      phone,
      loyaltyPoints,
      notes
    }`;

    if (id) {
      query = groq`*[_type == "customer" && _id == "${id}"][0]{
        _id,
        name,
        email,
        phone,
        loyaltyPoints,
        notes
      }`;
    } else if (email) {
      query = groq`*[_type == "customer" && email == "${email}"][0]{
        _id,
        name,
        email,
        phone,
        loyaltyPoints,
        notes
      }`;
    }

    const customers = await client.fetch(query);
    await logSanityInteraction('fetch', `Fetched customer(s) with ID: ${id || email || 'all'}`, 'customer', id, 'system', true, { query });

    return NextResponse.json(customers, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/customers:', error);
    let errorMessage = 'Failed to fetch customers.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch customers: ${errorMessage}`, 'customer', undefined, 'system', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let _id: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id');

    if (!_id) {
      return NextResponse.json({ message: 'Customer ID is required for update' }, { status: 400 });
    }

    const updates = await req.json(); // Expect JSON body for updates

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    // Ensure email uniqueness if email is being updated
    if (updates.email) {
      const existingCustomerWithNewEmail = await client.fetch(groq`*[_type == "customer" && email == $email && _id != $_id][0]`, { email: updates.email, _id });
      if (existingCustomerWithNewEmail) {
        return NextResponse.json({ message: 'Another customer with this email already exists.' }, { status: 409 });
      }
    }

    const updatedCustomer = await writeClient.patch(_id).set(updates).commit();
    await logSanityInteraction('update', `Updated customer: ${_id}`, 'customer', _id, 'admin', true, { payload: updates });

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/customers:', error);
    let errorMessage = 'Failed to update customer.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to update customer: ${errorMessage}`, 'customer', _id, 'admin', false, { errorDetails: errorMessage, payload: 'JSON Body received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Customer ID is required for deletion' }, { status: 400 });
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted customer with ID: ${id}`, 'customer', id, 'admin', true);

    return NextResponse.json({ message: 'Customer deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/customers:', error);
    let errorMessage = 'Failed to delete customer.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to delete customer: ${errorMessage}`, 'customer', id, 'admin', false, { errorDetails: errorMessage, payload: 'Customer ID: ' + id });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
