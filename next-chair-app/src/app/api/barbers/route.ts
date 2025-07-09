// src/app/api/barbers/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";

// Add this export to prevent Next.js static optimization
export const dynamic = 'force-dynamic'; // Add this line at the top

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name')?.toString();
    const bio = formData.get('bio')?.toString();
    const dailyAvailabilityJson = formData.get('dailyAvailability')?.toString();
    const imageFile = formData.get('image') as File | null;

    if (!name || !bio || !dailyAvailabilityJson) {
      return NextResponse.json({ message: 'Missing required fields (name, bio, dailyAvailability)' }, { status: 400 });
    }

    let dailyAvailability: any[] = [];
    try {
      // Add a check here to ensure dailyAvailabilityJson is not empty or malformed before parsing
      if (!dailyAvailabilityJson.trim()) { // .trim() to handle whitespace
        throw new Error('dailyAvailability is empty or contains only whitespace.');
      }
      dailyAvailability = JSON.parse(dailyAvailabilityJson);
      if (!Array.isArray(dailyAvailability) || dailyAvailability.some(block => !block.dayOfWeek || !block.startTime || !block.endTime)) {
        throw new Error('Invalid dailyAvailability format or missing required fields within blocks.');
      }
    } catch (parseError: any) {
      console.error('Error parsing dailyAvailability JSON:', parseError); // Log the specific parsing error
      return NextResponse.json({ message: `Invalid dailyAvailability format: ${parseError.message}` }, { status: 400 });
    }

    let imageAssetRef: any = null;
    if (imageFile) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const asset = await writeClient.assets.upload('image', buffer, { filename: imageFile.name }); // Add filename here
        imageAssetRef = {
          _type: 'image',
          asset: {
            _ref: asset._id,
            _type: 'reference',
          },
        };
      } catch (uploadError: any) {
        // Log the image upload error specifically
        console.error('Error uploading image to Sanity:', uploadError);
        await logSanityInteraction('error', `Failed to upload barber image: ${uploadError.message}`, 'barber', undefined, 'admin', false, { errorDetails: uploadError.message });
        return NextResponse.json({ message: `Failed to upload image: ${uploadError.message}` }, { status: 500 });
      }
    }

    const barberDoc = {
      _type: 'barber',
      name,
      slug: {
        _type: 'slug',
        current: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      },
      // Ensure bio is stored as an array of blocks as expected by Sanity's Portable Text
      bio: [{ _key: 'uniqueBioBlock', _type: 'block', children: [{ _key: 'uniqueBioSpan', _type: 'span', text: bio }] }],
      image: imageAssetRef,
      dailyAvailability,
    };

    const newBarber = await writeClient.create(barberDoc);

    await logSanityInteraction('create', `New barber '${name}' created successfully.`, 'barber', newBarber._id, 'admin', true, { payload: barberDoc });

    return NextResponse.json({ message: 'Barber created successfully!', barber: newBarber }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/barbers:', error);
    let errorMessage = 'Failed to create barber.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }

    await logSanityInteraction('error', `Failed to create barber: ${errorMessage}`, 'barber', undefined, 'admin', false, { errorDetails: errorMessage, payload: req.body }); // req.body might be empty here with formData

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
        const barbers = await client.fetch(groq`*[_type == "barber"]{
            _id,
            name,
            slug,
            image,
            bio,
            dailyAvailability
        }`);

        await logSanityInteraction('fetch', 'Fetched all barbers for dashboard revalidation.', 'barber', undefined, 'system', true);

        return NextResponse.json(barbers, { status: 200 });
    } catch (error: any) { // Catch all errors
        console.error('Error in GET /api/barbers:', error);
        let errorMessage = 'Failed to fetch barbers.';
        if (error instanceof Error) { // Check if it's a standard Error object
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            // Fallback for other objects that might have a 'message' property
            errorMessage = (error as any).message;
        }
        await logSanityInteraction('error', `Failed to fetch barbers: ${errorMessage}`, 'barber', undefined, 'system', false, { errorDetails: errorMessage });
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}