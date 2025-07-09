// src/app/api/testimonials/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

export const dynamic = 'force-dynamic';

// Helper to upload image and return asset ID (reused)
async function uploadImageToSanity(imageFile: File | string | null): Promise<string | undefined> {
  if (!imageFile) return undefined;

  if (typeof imageFile === 'string') {
    if (imageFile.startsWith('blob:') || imageFile.startsWith('data:')) {
      try {
        const uploadedAsset = await writeClient.assets.upload('image', imageFile);
        return uploadedAsset._id;
      } catch (uploadError) {
        console.error("Error uploading image from string/blob:", uploadError);
        throw new Error("Failed to upload image.");
      }
    }
  } else if (imageFile instanceof File) {
    try {
      const uploadedAsset = await writeClient.assets.upload('image', imageFile);
      return uploadedAsset._id;
    } catch (uploadError) {
      console.error("Error uploading image file:", uploadError);
      throw new Error("Failed to upload image.");
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const customerName = formData.get('customerName')?.toString();
    const quote = formData.get('quote')?.toString();
    const rating = formData.get('rating')?.toString();
    const date = formData.get('date')?.toString();
    const imageFile = formData.get('image') as File | null;

    if (!customerName || !quote || !rating) {
      return NextResponse.json({ message: 'Missing required fields (customerName, quote, rating)' }, { status: 400 });
    }

    let imageAssetRefId: string | undefined = undefined;
    if (imageFile) {
      imageAssetRefId = await uploadImageToSanity(imageFile);
    }

    const testimonialDoc: any = {
      _type: 'testimonial',
      customerName,
      quote,
      rating: Number(rating),
      date: date || new Date().toISOString(),
    };

    if (imageAssetRefId) {
      testimonialDoc.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetRefId,
        },
      };
    }

    const newTestimonial = await writeClient.create(testimonialDoc);
    await logSanityInteraction('create', `Created new testimonial from ${customerName}`, 'testimonial', newTestimonial._id, 'admin', true, { payload: testimonialDoc });

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/testimonials:', error);
    let errorMessage = 'Failed to create testimonial.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to create testimonial: ${errorMessage}`, 'testimonial', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let query = groq`*[_type == "testimonial"]{
      _id,
      customerName,
      quote,
      rating,
      date,
      "imageUrl": image.asset->url
    }`;

    if (id) {
      query = groq`*[_type == "testimonial" && _id == "${id}"][0]{
        _id,
        customerName,
        quote,
        rating,
        date,
        "imageUrl": image.asset->url
      }`;
    }

    const testimonials = await client.fetch(query);
    await logSanityInteraction('fetch', `Fetched testimonial(s) with ID: ${id || 'all'}`, 'testimonial', id, 'system', true, { query });

    return NextResponse.json(testimonials, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/testimonials:', error);
    let errorMessage = 'Failed to fetch testimonials.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch testimonials: ${errorMessage}`, 'testimonial', undefined, 'system', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let _id: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id');

    if (!_id) {
      return NextResponse.json({ message: 'Testimonial ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const customerName = formData.get('customerName')?.toString();
    const quote = formData.get('quote')?.toString();
    const rating = formData.get('rating')?.toString();
    const date = formData.get('date')?.toString();
    const imageFile = formData.get('image') as File | string | null;

    const currentTestimonial = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id });
    const oldImageAssetRef = currentTestimonial?.image?.asset?._ref;

    const patch = writeClient.patch(_id);
    const updates: any = {};

    if (customerName !== undefined) updates.customerName = customerName;
    if (quote !== undefined) updates.quote = quote;
    if (rating !== undefined) updates.rating = Number(rating);
    if (date !== undefined) updates.date = date;

    let newImageAssetRef: string | undefined = undefined;
    if (imageFile instanceof File) {
      newImageAssetRef = await uploadImageToSanity(imageFile);
      updates.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: newImageAssetRef,
        },
      };
    } else if (imageFile === 'null') {
      updates.image = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    const updatedTestimonial = await patch.set(updates).commit();
    await logSanityInteraction('update', `Updated testimonial: ${customerName || _id}`, 'testimonial', _id, 'admin', true, { payload: updates });

    if (oldImageAssetRef && (imageFile instanceof File || imageFile === 'null')) {
      try {
        await writeClient.delete(oldImageAssetRef);
        await logSanityInteraction('delete', `Deleted old testimonial image asset: ${oldImageAssetRef}`, 'testimonial', _id, 'admin', true);
      } catch (deleteError) {
        console.warn(`Could not delete old Sanity asset ${oldImageAssetRef}:`, deleteError);
      }
    }

    return NextResponse.json(updatedTestimonial, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/testimonials:', error);
    let errorMessage = 'Failed to update testimonial.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to update testimonial: ${errorMessage}`, 'testimonial', _id, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Testimonial ID is required for deletion' }, { status: 400 });
    }

    const testimonialToDelete = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id: id });
    if (testimonialToDelete?.image?.asset?._ref) {
      await writeClient.delete(testimonialToDelete.image.asset._ref);
      await logSanityInteraction('delete', `Deleted image asset for testimonial ${id}: ${testimonialToDelete.image.asset._ref}`, 'testimonial', id, 'admin', true);
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted testimonial with ID: ${id}`, 'testimonial', id, 'admin', true);

    return NextResponse.json({ message: 'Testimonial deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/testimonials:', error);
    let errorMessage = 'Failed to delete testimonial.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to delete testimonial: ${errorMessage}`, 'testimonial', id, 'admin', false, { errorDetails: errorMessage, payload: 'Testimonial ID: ' + id });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
