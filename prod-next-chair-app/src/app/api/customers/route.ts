// src/app/api/customers/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let customerId: string | undefined; // To store existing or new customer ID, accessible throughout the function
  let requestBody: any; // To store the parsed request body, also accessible in catch

  try {
    requestBody = await req.json();
    const { _id, name, email, phone, loyaltyPoints, notes } = requestBody;

    // Assign _id from requestBody to the outer-scoped customerId
    if (_id) {
      customerId = _id;
    }

    if (!name || !email) {
      await logSanityInteraction('error', 'Missing required fields (name, email) for customer operation.', 'customer', customerId, 'admin', false, { payload: requestBody });
      return NextResponse.json({ message: 'Missing required fields (name, email)' }, { status: 400 });
    }

    let customerDoc: any;
    let operationType: 'create' | 'update';
    if (customerId) { // Use customerId here
      // Update existing customer
      operationType = 'update';
      customerDoc = {
        _type: 'customer',
        _id: customerId, // Use customerId here
        name,
        email,
        phone: phone || null,
        loyaltyPoints: loyaltyPoints || 0,
        notes: notes || null,
      };

      // Check for existing email on update (if email is changed)
      const existingCustomerWithEmail = await client.fetch(groq`*[_type == "customer" && email == $email && _id != $_id][0]`, { email, _id: customerId });
      if (existingCustomerWithEmail) {
        await logSanityInteraction('error', `Attempted to update customer ${customerId} to an email that already exists: ${email}.`, 'customer', customerId, 'admin', false);
        return NextResponse.json({ message: 'Another customer with this email already exists.' }, { status: 409 });
      }

      await writeClient.createOrReplace(customerDoc);
      await logSanityInteraction(operationType, `Updated customer: ${name} (${email})`, 'customer', customerId, 'admin', true, { payload: customerDoc });
    } else {
      // Create new customer
      operationType = 'create';
      // Check if customer with this email already exists on creation
      const existingCustomer = await client.fetch(groq`*[_type == "customer" && email == $email][0]`, { email });
      if (existingCustomer) {
        // If an existing customer is found, use their _id for logging
        customerId = existingCustomer._id;
        await logSanityInteraction('error', `Attempted to create customer with existing email: ${email}.`, 'customer', customerId, 'admin', false);
        return NextResponse.json({ message: 'Customer with this email already exists.' }, { status: 409 });
      }

      customerDoc = {
        _type: 'customer',
        name,
        email,
        phone: phone || null,
        loyaltyPoints: loyaltyPoints || 0,
        notes: notes || null,
      };
      const newCustomer = await writeClient.create(customerDoc);
      customerId = newCustomer._id; // Set customerId for logging
      await logSanityInteraction(operationType, `Created new customer: ${name} (${email})`, 'customer', customerId, 'admin', true, { payload: customerDoc });
    }

    return NextResponse.json({ message: `Customer ${operationType}d successfully!`, customerId: customerId }, { status: operationType === 'create' ? 201 : 200 });
  } catch (error: any) {
    console.error('Error in POST /api/customers:', error);
    let errorMessage = 'Failed to process customer operation.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Now 'customerId' is accessible here
    await logSanityInteraction('error', `Failed to update customer: ${errorMessage}`, 'customer', customerId, 'admin', false, { errorDetails: errorMessage, payload: requestBody ? 'JSON Body received: ' + JSON.stringify(requestBody) : 'No JSON Body received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    let query;
    let queryParams: { id?: string; email?: string } = {};

    if (id) {
      query = groq`*[_type == "customer" && _id == $id][0]`;
      queryParams.id = id;
    } else if (email) {
      query = groq`*[_type == "customer" && email == $email][0]`;
      queryParams.email = email;
    } else {
      query = groq`*[_type == "customer"]|order(_createdAt desc)`;
    }

    const customers = await client.fetch(query, queryParams);
    // Corrected line: Removed 'query' and 'queryParams' from the details object
    await logSanityInteraction('fetch', `Fetched customer(s) with ID: ${id || email || 'all'}`, 'customer', id ?? undefined, 'system', true, {}); // Empty details object or include supported properties like { payload: JSON.stringify({ query, queryParams }) } if 'payload' is allowed and you need this data logged.

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
    await logSanityInteraction('error', `Failed to update customer: ${errorMessage}`, 'customer', _id ?? undefined, 'admin', false, { errorDetails: errorMessage, payload: 'JSON Body received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let id: string | null = null; // Declare 'id' here, outside the try block, and initialize to null

  try {
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id'); // Assign the customer ID from searchParams to the 'id' variable

    if (!id) {
      await logSanityInteraction('error', 'Customer ID is missing for deletion request.', 'customer', undefined, 'admin', false);
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
    // IMPORTANT: Ensure this line uses 'id ?? undefined' and NOT '_id'
    // This is the line that corresponds to your error at route.ts:164:99
    await logSanityInteraction('error', `Failed to delete customer: ${errorMessage}`, 'customer', id ?? undefined, 'admin', false, { errorDetails: errorMessage, payload: 'Customer ID: ' + (id || 'N/A') });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}