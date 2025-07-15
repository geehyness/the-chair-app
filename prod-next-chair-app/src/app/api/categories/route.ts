// src/app/api/categories/route.ts
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
        // Convert blob/data URL string to a Blob object
        const response = await fetch(imageFile);
        const blob = await response.blob();
        const uploadedAsset = await writeClient.assets.upload('image', blob); // Pass the Blob
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
    const title = formData.get('title')?.toString();
    const slug = formData.get('slug')?.toString();
    const description = formData.get('description')?.toString();
    const imageFile = formData.get('image') as File | null;

    if (!title || !slug) {
      return NextResponse.json({ message: 'Missing required fields (title, slug)' }, { status: 400 });
    }

    let imageAssetRefId: string | undefined = undefined;
    if (imageFile) {
      imageAssetRefId = await uploadImageToSanity(imageFile);
    }

    const categoryDoc: any = {
      _type: 'category',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      description,
    };

    if (imageAssetRefId) {
      categoryDoc.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetRefId,
        },
      };
    }

    const newCategory = await writeClient.create(categoryDoc);
    await logSanityInteraction('create', `Created new category: ${title}`, 'category', newCategory._id, 'admin', true, { payload: categoryDoc });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/categories:', error);
    let errorMessage = 'Failed to create category.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to create category: ${errorMessage}`, 'category', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let query;
    if (id) {
      query = groq`*[_type == "category" && _id == $id][0]{
        _id,
        _createdAt,
        title,
        "slug": slug.current,
        description,
        "imageUrl": image.asset->url
      }`;
    } else {
      query = groq`*[_type == "category"]|order(_createdAt desc){
        _id,
        _createdAt,
        title,
        "slug": slug.current,
        description,
        "imageUrl": image.asset->url
      }`;
    }

    const categories = await client.fetch(query, id ? { id } : {}); // Pass id as a parameter if it exists
    await logSanityInteraction('fetch', `Fetched category(s) with ID: ${id || 'all'}`, 'category', id ?? undefined, 'system', true, { query }); // Changed id to id ?? undefined

    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/categories:', error);
    let errorMessage = 'Failed to fetch categories.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch categories: ${errorMessage}`, 'category', undefined, 'system', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let _id: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id');

    if (!_id) {
      return NextResponse.json({ message: 'Category ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString();
    const slug = formData.get('slug')?.toString();
    const description = formData.get('description')?.toString();
    const imageFile = formData.get('image') as File | string | null;

    const currentCategory = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id });
    const oldImageAssetRef = currentCategory?.image?.asset?._ref;

    const patch = writeClient.patch(_id);
    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = { _type: 'slug', current: slug };
    if (description !== undefined) updates.description = description;

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

    const updatedCategory = await patch.set(updates).commit();
    await logSanityInteraction('update', `Updated category: ${title || _id}`, 'category', _id, 'admin', true, { payload: updates });

    if (oldImageAssetRef && (imageFile instanceof File || imageFile === 'null')) {
      try {
        await writeClient.delete(oldImageAssetRef);
        await logSanityInteraction('delete', `Deleted old category image asset: ${oldImageAssetRef}`, 'category', _id, 'admin', true);
      } catch (deleteError) {
        console.warn(`Could not delete old Sanity asset ${oldImageAssetRef}:`, deleteError);
      }
    }

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/categories:', error);
    let errorMessage = 'Failed to process category operation.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Corrected line: Convert _id from string | null to string | undefined
    await logSanityInteraction('error', `Failed to update category: ${errorMessage}`, 'category', _id ?? undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let id: string | null = null; // Declare id outside the try block and initialize it to null

  try {
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id'); // Assign value to the outer-scoped id

    if (!id) {
      // Log this specific error as well
      await logSanityInteraction('error', 'Category ID is missing for deletion request.', 'category', undefined, 'admin', false);
      return NextResponse.json({ message: 'Category ID is required for deletion' }, { status: 400 });
    }

    const categoryToDelete = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id: id });
    if (categoryToDelete?.image?.asset?._ref) {
      await writeClient.delete(categoryToDelete.image.asset._ref);
      await logSanityInteraction('delete', `Deleted image asset for category ${id}: ${categoryToDelete.image.asset._ref}`, 'category', id, 'admin', true);
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted category with ID: ${id}`, 'category', id, 'admin', true);

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/categories:', error);
    let errorMessage = 'Failed to delete category.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Now 'id' is accessible here
    await logSanityInteraction('error', `Failed to delete category: ${errorMessage}`, 'category', id ?? undefined, 'admin', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}