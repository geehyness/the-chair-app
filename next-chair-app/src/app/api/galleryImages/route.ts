// src/app/api/galleryImages/route.ts
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
    const caption = formData.get('caption')?.toString();
    const tagsJson = formData.get('tags')?.toString(); // JSON string for array
    const featured = formData.get('featured')?.toString() === 'true'; // Convert to boolean
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ message: 'Image file is required.' }, { status: 400 });
    }

    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
        if (!Array.isArray(tags)) {
          throw new Error('Tags is not a valid array.');
        }
      } catch (parseError) {
        console.error("Error parsing tags:", parseError);
        return NextResponse.json({ message: 'Invalid format for tags' }, { status: 400 });
      }
    }

    const imageAssetRefId = await uploadImageToSanity(imageFile);
    if (!imageAssetRefId) {
      throw new Error("Failed to upload image asset.");
    }

    const galleryImageDoc: any = {
      _type: 'galleryImage',
      caption,
      tags,
      featured,
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetRefId,
        },
      },
    };

    const newGalleryImage = await writeClient.create(galleryImageDoc);
    await logSanityInteraction('create', `Created new gallery image: ${caption || newGalleryImage._id}`, 'galleryImage', newGalleryImage._id, 'admin', true, { payload: galleryImageDoc });

    return NextResponse.json(newGalleryImage, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/galleryImages:', error);
    let errorMessage = 'Failed to create gallery image.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to create gallery image: ${errorMessage}`, 'galleryImage', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const featuredOnly = searchParams.get('featured') === 'true';

    let query = groq`*[_type == "galleryImage"]{
      _id,
      caption,
      tags,
      featured,
      "imageUrl": image.asset->url
    }`;

    if (id) {
      query = groq`*[_type == "galleryImage" && _id == "${id}"][0]{
        _id,
        caption,
        tags,
        featured,
        "imageUrl": image.asset->url
      }`;
    } else if (featuredOnly) {
      query = groq`*[_type == "galleryImage" && featured == true]{
        _id,
        caption,
        tags,
        featured,
        "imageUrl": image.asset->url
      }`;
    }

    const galleryImages = await client.fetch(query);
    await logSanityInteraction('fetch', `Fetched gallery image(s) with ID: ${id || 'all'}`, 'galleryImage', id, 'system', true, { query });

    return NextResponse.json(galleryImages, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/galleryImages:', error);
    let errorMessage = 'Failed to fetch gallery images.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch gallery images: ${errorMessage}`, 'galleryImage', undefined, 'system', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let _id: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id');

    if (!_id) {
      return NextResponse.json({ message: 'Gallery Image ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const caption = formData.get('caption')?.toString();
    const tagsJson = formData.get('tags')?.toString();
    const featured = formData.get('featured')?.toString(); // Read as string, convert later
    const imageFile = formData.get('image') as File | string | null;

    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
        if (!Array.isArray(tags)) {
          throw new Error('Tags is not a valid array.');
        }
      } catch (parseError) {
        console.error("Error parsing tags:", parseError);
        return NextResponse.json({ message: 'Invalid format for tags' }, { status: 400 });
      }
    }

    const currentGalleryImage = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id });
    const oldImageAssetRef = currentGalleryImage?.image?.asset?._ref;

    const patch = writeClient.patch(_id);
    const updates: any = {};

    if (caption !== undefined) updates.caption = caption;
    if (tagsJson !== undefined) updates.tags = tags;
    if (featured !== undefined) updates.featured = featured === 'true';

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

    const updatedGalleryImage = await patch.set(updates).commit();
    await logSanityInteraction('update', `Updated gallery image: ${caption || _id}`, 'galleryImage', _id, 'admin', true, { payload: updates });

    if (oldImageAssetRef && (imageFile instanceof File || imageFile === 'null')) {
      try {
        await writeClient.delete(oldImageAssetRef);
        await logSanityInteraction('delete', `Deleted old gallery image asset: ${oldImageAssetRef}`, 'galleryImage', _id, 'admin', true);
      } catch (deleteError) {
        console.warn(`Could not delete old Sanity asset ${oldImageAssetRef}:`, deleteError);
      }
    }

    return NextResponse.json(updatedGalleryImage, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/galleryImages:', error);
    let errorMessage = 'Failed to update gallery image.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to update gallery image: ${errorMessage}`, 'galleryImage', _id, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Gallery Image ID is required for deletion' }, { status: 400 });
    }

    const galleryImageToDelete = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id: id });
    if (galleryImageToDelete?.image?.asset?._ref) {
      await writeClient.delete(galleryImageToDelete.image.asset._ref);
      await logSanityInteraction('delete', `Deleted image asset for gallery image ${id}: ${galleryImageToDelete.image.asset._ref}`, 'galleryImage', id, 'admin', true);
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted gallery image with ID: ${id}`, 'galleryImage', id, 'admin', true);

    return NextResponse.json({ message: 'Gallery image deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/galleryImages:', error);
    let errorMessage = 'Failed to delete gallery image.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to delete gallery image: ${errorMessage}`, 'galleryImage', id, 'admin', false, { errorDetails: errorMessage, payload: 'Gallery Image ID: ' + id });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
