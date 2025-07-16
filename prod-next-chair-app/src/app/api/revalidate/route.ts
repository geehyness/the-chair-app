// src/app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // *** WARNING: SECRET VALIDATION HAS BEEN REMOVED FOR TESTING/USER REQUEST. ***
  // *** THIS IS HIGHLY INSECURE AND NOT RECOMMENDED FOR PRODUCTION ENVIRONMENTS. ***
  // *** ANYONE CAN NOW TRIGGER REVALIDATIONS ON YOUR SITE. ***

  try {
    const body = await request.json(); // This might throw if body is not valid JSON
    const { _type, slug } = body;

    console.log(`Received Sanity webhook for type: ${_type}`);

    // Revalidate specific paths based on the changed content type
    // Adjust these paths to match your actual pages.

    if (_type === 'appointment' || _type === 'barber' || _type === 'service' || _type === 'customer' || _type === 'contact' || _type === 'siteSettings') {
      revalidatePath('/barber-dashboard');
      revalidatePath('/barber-dashboard/manage');
      revalidatePath('/barber-dashboard/messages');
      revalidatePath('/barber-dashboard/admin-reports');
      console.log('Revalidated main admin dashboard pages.');
    }

    if (_type === 'barber' && slug?.current) {
        revalidatePath(`/barbers/${slug.current}`);
        console.log(`Revalidated barber profile: /barbers/${slug.current}`);
    }

    if (_type === 'blogPost' && slug?.current) {
        revalidatePath(`/blog/${slug.current}`);
        revalidatePath('/blog');
        console.log(`Revalidated blog post: /blog/${slug.current} and blog listing`);
    }

    if (_type === 'category' || _type === 'service') {
        revalidatePath('/services');
        console.log('Revalidated services overview page.');
    }

    // Fallback: If no specific type match, revalidate a common path or all relevant ones
    revalidatePath('/barber-dashboard');
    revalidatePath('/barber-dashboard/manage');


    console.log('Revalidation process completed successfully.');
    return NextResponse.json({ revalidated: true, now: Date.now() });

  } catch (error) {
    console.error('Error during revalidation process:', error);
    return new NextResponse(`Error revalidating: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}