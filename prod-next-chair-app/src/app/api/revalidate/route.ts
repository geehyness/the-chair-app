// src/app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 1. Validate the secret
  const secret = request.headers.get('x-sanity-signature'); // Sanity webhooks send a signature header

  // IMPORTANT: Replace 'YOUR_SANITY_WEBHOOK_SECRET' with the actual secret
  // you will configure in Sanity. It should match the environment variable.
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    console.error('Invalid revalidation secret provided.');
    return new NextResponse('Invalid secret', { status: 401 });
  }

  try {
    // 2. Parse the Sanity webhook payload (optional, but good for granular control)
    const body = await request.json();
    const { _type, slug } = body; // Sanity sends _type and often a slug

    console.log(`Received Sanity webhook for type: ${_type}`);

    // 3. Revalidate specific paths based on the changed content type
    //    Adjust these paths to match your actual pages.

    if (_type === 'appointment' || _type === 'barber' || _type === 'service' || _type === 'customer' || _type === 'contact' || _type === 'siteSettings') {
      // Revalidate dashboard overview pages if core data changes
      revalidatePath('/barber-dashboard');
      revalidatePath('/barber-dashboard/manage');
      revalidatePath('/barber-dashboard/messages');
      revalidatePath('/barber-dashboard/admin-reports');
      console.log('Revalidated main admin dashboard pages.');
    }

    if (_type === 'barber' && slug?.current) {
        // If you have specific barber profile pages, revalidate them too
        revalidatePath(`/barbers/${slug.current}`);
        console.log(`Revalidated barber profile: /barbers/${slug.current}`);
    }

    // Add more conditions for other content types and their associated pages
    if (_type === 'blogPost' && slug?.current) {
        revalidatePath(`/blog/${slug.current}`);
        revalidatePath('/blog'); // Revalidate blog listing page
        console.log(`Revalidated blog post: /blog/${slug.current} and blog listing`);
    }

    if (_type === 'category' || _type === 'service') {
        // Revalidate any pages that list categories or services, e.g., a services overview
        revalidatePath('/services');
        console.log('Revalidated services overview page.');
    }

    // Fallback: If no specific type match, revalidate a common path or all relevant ones
    // You can remove this if your specific revalidate calls cover everything.
    revalidatePath('/barber-dashboard');
    revalidatePath('/barber-dashboard/manage');


    console.log('Revalidation process completed successfully.');
    return NextResponse.json({ revalidated: true, now: Date.now() });

  } catch (error) {
    console.error('Error during revalidation:', error);
    return new NextResponse('Error revalidating', { status: 500 });
  }
}