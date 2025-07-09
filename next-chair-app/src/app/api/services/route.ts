// src/app/api/services/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

export const dynamic = 'force-dynamic';

// Helper to upload image and return asset ID
async function uploadImageToSanity(imageFile: File | string | null): Promise<string | undefined> {
  if (!imageFile) return undefined;

  if (typeof imageFile === 'string') {
    // If it's a string, assume it's an existing imageUrl (e.g., from Sanity or a blob URL for new upload)
    if (imageFile.startsWith('blob:') || imageFile.startsWith('data:')) {
      // It's a new file (blob or data URL), upload it
      try {
        const uploadedAsset = await writeClient.assets.upload('image', imageFile);
        return uploadedAsset._id;
      } catch (uploadError) {
        console.error("Error uploading image from string/blob:", uploadError);
        throw new Error("Failed to upload image.");
      }
    } else {
      // It's a direct URL to an existing image asset, return it as is if needed,
      // or handle cases where it's an existing Sanity asset ID.
      // For simplicity, if it's not a new upload (blob/data URL), assume it's an existing Sanity image URL
      // and we don't need to re-upload. If you track asset IDs, you'd use that.
      // For now, if client sends an existing URL, we don't re-upload.
      return undefined; // Indicate no new upload needed
    }
  } else if (imageFile instanceof File) {
    // It's a new file, upload it
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
    const formData = await req.formData(); // CHANGE: Read as FormData
    const name = formData.get('name')?.toString();
    const slug = formData.get('slug')?.toString();
    const description = formData.get('description')?.toString();
    const duration = formData.get('duration')?.toString(); // Read as string
    const price = formData.get('price')?.toString();       // Read as string
    const categoryId = formData.get('categoryId')?.toString();
    const barberIdsJson = formData.get('barberIds')?.toString(); // Expect JSON string for array
    const imageFile = formData.get('image') as File | null; // Get the actual file

    if (!name || !slug || !duration || price === undefined || price === null) {
      return NextResponse.json({ message: 'Missing required fields (name, slug, duration, price)' }, { status: 400 });
    }

    let barberIds: string[] = [];
    if (barberIdsJson) {
      try {
        barberIds = JSON.parse(barberIdsJson);
        if (!Array.isArray(barberIds)) {
          throw new Error('barberIds is not a valid array.');
        }
      } catch (parseError) {
        console.error("Error parsing barberIds:", parseError);
        return NextResponse.json({ message: 'Invalid format for barberIds' }, { status: 400 });
      }
    }

    // Upload image if a new file is provided
    let imageAssetRefId: string | undefined = undefined;
    if (imageFile) {
        imageAssetRefId = await uploadImageToSanity(imageFile);
    }


    const serviceDoc: any = {
      _type: 'service',
      name,
      slug: {
        _type: 'slug',
        current: slug,
      },
      description,
      duration: Number(duration), // Convert to number
      price: Number(price),       // Convert to number
    };

    if (categoryId) {
      serviceDoc.category = {
        _type: 'reference',
        _ref: categoryId,
      };
    }

    if (barberIds.length > 0) {
      serviceDoc.barbers = barberIds.map(id => ({
        _type: 'reference',
        _ref: id,
      }));
    }

    if (imageAssetRefId) {
      serviceDoc.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAssetRefId,
        },
      };
    }

    const newService = await writeClient.create(serviceDoc);
    await logSanityInteraction('create', `Created new service: ${name}`, 'service', newService._id, 'admin', true, { payload: serviceDoc });

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/services:', error);
    let errorMessage = 'Failed to create service.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to create service: ${errorMessage}`, 'service', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let _id: string | null = null; // Declare _id outside the try block
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id'); // Assign value here

    if (!_id) {
      return NextResponse.json({ message: 'Service ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name')?.toString();
    const slug = formData.get('slug')?.toString();
    const description = formData.get('description')?.toString();
    const duration = formData.get('duration')?.toString();
    const price = formData.get('price')?.toString();
    const categoryId = formData.get('categoryId')?.toString();
    const barberIdsJson = formData.get('barberIds')?.toString();
    const imageFile = formData.get('image') as File | string | null;

    let barberIds: string[] = [];
    if (barberIdsJson) {
      try {
        barberIds = JSON.parse(barberIdsJson);
        if (!Array.isArray(barberIds)) {
          throw new Error('barberIds is not a valid array.');
        }
      } catch (parseError) {
        console.error("Error parsing barberIds:", parseError);
        return NextResponse.json({ message: 'Invalid format for barberIds' }, { status: 400 });
      }
    }

    const currentService = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id });
    const oldImageAssetRef = currentService?.image?.asset?._ref; // Store old image asset ref

    const patch = writeClient.patch(_id);
    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = { _type: 'slug', current: slug };
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duration = Number(duration);
    if (price !== undefined) updates.price = Number(price);

    // Update category reference
    if (categoryId !== undefined) {
      updates.category = categoryId ? { _type: 'reference', _ref: categoryId } : null;
    }

    // Update barbers references
    if (barberIdsJson !== undefined) {
      updates.barbers = barberIds.length > 0 ? barberIds.map(id => ({ _type: 'reference', _ref: id })) : [];
    }

    // Handle image update/removal
    let newImageAssetRef: string | undefined = undefined;
    if (imageFile instanceof File) {
        // New file uploaded, get new asset ref
        newImageAssetRef = await uploadImageToSanity(imageFile);
        updates.image = {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: newImageAssetRef,
            },
        };
    } else if (imageFile === 'null') { // Client sent 'null' string to explicitly remove image
        updates.image = null; // Set image to null to remove it
    }
    // If no imageFile and not 'null', then `updates.image` is not touched,
    // meaning the existing image (if any) will be retained.


    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    const updatedService = await patch.set(updates).commit(); // Commit changes to the document FIRST
    await logSanityInteraction('update', `Updated service: ${name || _id}`, 'service', _id, 'admin', true, { payload: updates });

    // NOW, delete the old asset if it's no longer referenced by this document
    if (oldImageAssetRef && (imageFile instanceof File || imageFile === 'null')) {
        // Only delete if there was an old image and a new one was uploaded, or it was explicitly removed
        try {
            await writeClient.delete(oldImageAssetRef);
            await logSanityInteraction('delete', `Deleted old service image asset: ${oldImageAssetRef}`, 'service', _id, 'admin', true);
        } catch (deleteError) {
            console.warn(`Could not delete old Sanity asset ${oldImageAssetRef}:`, deleteError);
            // Log a warning, but don't fail the entire request as the service update was successful
        }
    }


    return NextResponse.json(updatedService, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/services:', error);
    let errorMessage = 'Failed to update service.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to update service: ${errorMessage}`, 'service', _id, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// Existing GET and DELETE methods (no changes needed for this issue)
export async function GET(req: NextRequest) {
  try {
    const services = await client.fetch(groq`*[_type == "service"]{
      _id,
      name,
      slug,
      description,
      "imageUrl": image.asset->url,
      duration,
      price,
      category->{_id, title},
      barbers[]->{_id, name}
    }`);

    await logSanityInteraction('fetch', 'Fetched all services for dashboard revalidation.', 'service', undefined, 'system', true);

    return NextResponse.json(services, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/services:', error);
    let errorMessage = 'Failed to fetch services.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch services: ${errorMessage}`, 'service', undefined, 'system', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Service ID is required for deletion' }, { status: 400 });
    }

    // Optional: Fetch the service to get image asset ID before deleting the document
    const serviceToDelete = await client.fetch(groq`*[_id == $_id][0]{image}`, { _id: id });
    if (serviceToDelete?.image?.asset?._ref) {
        await writeClient.delete(serviceToDelete.image.asset._ref);
        await logSanityInteraction('delete', `Deleted image asset for service ${id}: ${serviceToDelete.image.asset._ref}`, 'service', id, 'admin', true);
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted service with ID: ${id}`, 'service', id, 'admin', true);

    return NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/services:', error);
    let errorMessage = 'Failed to delete service.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to delete service: ${errorMessage}`, 'service', id, 'admin', false, { errorDetails: errorMessage, payload: 'Service ID: ' + id });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}