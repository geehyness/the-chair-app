// the-chair-app/app/api/customer/route.ts
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
// import { logger } from '@/lib/logger'; // Application logger
import { logSanityInteraction } from '@/lib/sanityLogger'; // NEW: Sanity Interaction Logger

// POST handler for finding or creating a customer
export async function POST(req: Request) {
  const startTime = process.hrtime.bigint(); // Start timing
  let customerId = 'N/A';
  let operationMessage = '';
  let success = false;
  let errorDetails: any = null;

  try {
    const { name, email, phone } = await req.json();

    // Basic validation
    if (!name || !email) {
      // logger.warn('Customer API: Missing required fields (name or email).', { name, email });
      operationMessage = 'Missing required fields for customer processing.';
      return NextResponse.json({ message: 'Name and email are required.' }, { status: 400 });
    }

    // Use a Sanity client with a token for write operations
    const clientWithToken = client.withConfig({
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    });

    // 1. Check if customer already exists by email
    // logger.info(`Customer API: Checking for existing customer with email: ${email}`);
    const existingCustomer = await clientWithToken.fetch(
      `*[_type == "customer" && email == $email][0]`,
      { email }
    );

    if (existingCustomer) {
      customerId = existingCustomer._id;
      // logger.info('Customer API: Existing customer found.', { customerId });
      operationMessage = `Existing customer found: ${email}`;
      success = true;
      return NextResponse.json({ message: 'Customer found.', customer: existingCustomer }, { status: 200 });
    } else {
      // 2. If not, create a new customer
      // logger.info('Customer API: No existing customer found, creating new one.', { email });
      const newCustomer = {
        _type: 'customer',
        name,
        email,
        phone: phone || '',
      };
      const createdCustomer = await clientWithToken.create(newCustomer);
      customerId = createdCustomer._id;
      // logger.info('Customer API: New customer created successfully.', { customerId });
      operationMessage = `New customer created: ${email}`;
      success = true;
      return NextResponse.json({ message: 'Customer created.', customer: createdCustomer }, { status: 201 });
    }
  } catch (error: any) {
    // logger.error('Customer API: Error processing customer:', { message: error.message, stack: error.stack });
    operationMessage = `Error processing customer: ${error.message}`;
    success = false;
    errorDetails = { message: error.message, stack: error.stack };
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  } finally {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

    // Log the interaction to Sanity
    await logSanityInteraction(
      'customerLookup', // Specific operation type for this API
      operationMessage,
      'customer',
      customerId,
      email, // Using email as a pseudo-userId for customer actions
      success,
      {
        payload: req.json().catch(() => {}), // Log the request payload
        errorDetails,
        durationMs,
      }
    );
  }
}
