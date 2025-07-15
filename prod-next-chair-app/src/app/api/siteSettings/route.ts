// src/app/api/siteSettings/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

export const dynamic = 'force-dynamic';

// Helper to upload image and return asset ID (reused from other routes)
async function uploadImageToSanity(imageFile: File | string | null): Promise<string | undefined> {
  if (!imageFile) return undefined;

  if (typeof imageFile === 'string') {
    if (imageFile.startsWith('blob:') || imageFile.startsWith('data:')) {
      try {
        // Convert the string (blob or data URL) to a Blob object
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

// GET: Fetch the single site settings document
export async function GET(req: NextRequest) {
  try {
    const siteSettings = await client.fetch(groq`*[_type == "siteSettings"][0]{
      _id,
      title,
      description,
      "logoUrl": logo.asset->url,
      "coverImageUrl": coverImage.asset->url,
      phone,
      email,
      location,
      socialLinks[]{
        platform,
        url
      }
    }`);

    await logSanityInteraction('fetch', 'Fetched site settings.', 'siteSettings', siteSettings?._id, 'system', true);

    return NextResponse.json(siteSettings || {}, { status: 200 }); // Return empty object if no settings found
  } catch (error: any) {
    console.error('Error in GET /api/siteSettings:', error);
    let errorMessage = 'Failed to fetch site settings.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to fetch site settings: ${errorMessage}`, 'siteSettings', undefined, 'system', false, { errorDetails: errorMessage });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST (Upsert): Create or update the single site settings document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const phone = formData.get('phone')?.toString();
    const email = formData.get('email')?.toString();
    const location = formData.get('location')?.toString();
    const socialLinksJson = formData.get('socialLinks')?.toString(); // JSON string for array
    const logoFile = formData.get('logo') as File | null;
    const coverImageFile = formData.get('coverImage') as File | null;

    let socialLinks: Array<{ platform: string; url: string }> = [];
    if (socialLinksJson) {
      try {
        socialLinks = JSON.parse(socialLinksJson);
        if (!Array.isArray(socialLinks)) {
          throw new Error('Social links is not a valid array.');
        }
      } catch (parseError) {
        console.error("Error parsing socialLinks:", parseError);
        return NextResponse.json({ message: 'Invalid format for social links' }, { status: 400 });
      }
    }

    // Fetch existing settings to get their _id and current image assets
    const existingSettings = await client.fetch(groq`*[_type == "siteSettings"][0]{_id, logo, coverImage}`);
    const settingsId = existingSettings?._id;
    const oldLogoAssetRef = existingSettings?.logo?.asset?._ref;
    const oldCoverImageAssetRef = existingSettings?.coverImage?.asset?._ref;

    let logoAssetRefId: string | undefined = undefined;
    if (logoFile) {
      logoAssetRefId = await uploadImageToSanity(logoFile);
    }

    let coverImageAssetRefId: string | undefined = undefined;
    if (coverImageFile) {
      coverImageAssetRefId = await uploadImageToSanity(coverImageFile);
    }

    const siteSettingsDoc: any = {
      _type: 'siteSettings',
      title,
      description,
      phone,
      email,
      location,
      socialLinks,
    };

    if (logoAssetRefId) {
      siteSettingsDoc.logo = { _type: 'image', asset: { _type: 'reference', _ref: logoAssetRefId } };
    }
    if (coverImageAssetRefId) {
      siteSettingsDoc.coverImage = { _type: 'image', asset: { _type: 'reference', _ref: coverImageAssetRefId } };
    }

    let result;
    let operationType = 'create';
    if (settingsId) {
      // If settings exist, update them
      result = await writeClient.patch(settingsId).set(siteSettingsDoc).commit();
      operationType = 'update';

      // Delete old assets if new ones were uploaded
      if (oldLogoAssetRef && logoAssetRefId) {
        try { await writeClient.delete(oldLogoAssetRef); } catch (e) { console.warn("Failed to delete old logo asset:", e); }
      }
      if (oldCoverImageAssetRef && coverImageAssetRefId) {
        try { await writeClient.delete(oldCoverImageAssetRef); } catch (e) { console.warn("Failed to delete old cover image asset:", e); }
      }
    } else {
      // If no settings exist, create them
      result = await writeClient.create(siteSettingsDoc);
    }

    await logSanityInteraction(operationType, `Site settings ${operationType}d.`, 'siteSettings', result._id, 'admin', true, { payload: siteSettingsDoc });

    return NextResponse.json(result, { status: operationType === 'create' ? 201 : 200 });
  } catch (error: any) {
    console.error('Error in POST /api/siteSettings:', error);
    let errorMessage = 'Failed to save site settings.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to save site settings: ${errorMessage}`, 'siteSettings', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// PUT: Update the single site settings document (requires ID)
export async function PUT(req: NextRequest) {
  let _id: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id');

    if (!_id) {
      return NextResponse.json({ message: 'Site Settings ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const phone = formData.get('phone')?.toString();
    const email = formData.get('email')?.toString();
    const location = formData.get('location')?.toString();
    const socialLinksJson = formData.get('socialLinks')?.toString();
    const logoFile = formData.get('logo') as File | string | null; // Can be File or 'null' string
    const coverImageFile = formData.get('coverImage') as File | string | null; // Can be File or 'null' string

    let socialLinks: Array<{ platform: string; url: string }> = [];
    if (socialLinksJson) {
      try {
        socialLinks = JSON.parse(socialLinksJson);
        if (!Array.isArray(socialLinks)) {
          throw new Error('Social links is not a valid array.');
        }
      } catch (parseError) {
        console.error("Error parsing socialLinks:", parseError);
        return NextResponse.json({ message: 'Invalid format for social links' }, { status: 400 });
      }
    }

    const currentSettings = await client.fetch(groq`*[_id == $_id][0]{logo, coverImage}`, { _id });
    const oldLogoAssetRef = currentSettings?.logo?.asset?._ref;
    const oldCoverImageAssetRef = currentSettings?.coverImage?.asset?._ref;

    const patch = writeClient.patch(_id);
    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (location !== undefined) updates.location = location;
    if (socialLinksJson !== undefined) updates.socialLinks = socialLinks;

    // Handle logo update/removal
    let newLogoAssetRef: string | undefined = undefined;
    if (logoFile instanceof File) {
      newLogoAssetRef = await uploadImageToSanity(logoFile);
      updates.logo = { _type: 'image', asset: { _type: 'reference', _ref: newLogoAssetRef } };
    } else if (logoFile === 'null') {
      updates.logo = null;
    }

    // Handle cover image update/removal
    let newCoverImageAssetRef: string | undefined = undefined;
    if (coverImageFile instanceof File) {
      newCoverImageAssetRef = await uploadImageToSanity(coverImageFile);
      updates.coverImage = { _type: 'image', asset: { _type: 'reference', _ref: newCoverImageAssetRef } };
    } else if (coverImageFile === 'null') {
      updates.coverImage = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    const updatedSettings = await patch.set(updates).commit();
    await logSanityInteraction('update', `Updated site settings: ${_id}`, 'siteSettings', _id, 'admin', true, { payload: updates });

    // Delete old assets if new ones were uploaded or existing ones were removed
    if (oldLogoAssetRef && (logoFile instanceof File || logoFile === 'null')) {
      try { await writeClient.delete(oldLogoAssetRef); } catch (e) { console.warn("Failed to delete old logo asset:", e); }
    }
    if (oldCoverImageAssetRef && (coverImageFile instanceof File || coverImageFile === 'null')) {
      try { await writeClient.delete(oldCoverImageAssetRef); } catch (e) { console.warn("Failed to delete old cover image asset:", e); }
    }

    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/siteSettings:', error);
    let errorMessage = 'Failed to update site settings.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to update site settings: ${errorMessage}`, 'siteSettings', _id ?? undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// DELETE: Not typically used for singleton site settings, but included for completeness.
// It will delete the *only* site settings document.
export async function DELETE(req: NextRequest) {
  let id: string | null = null; // Declare id here, outside the try block
  try {
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id'); // Assign id from searchParams

    if (!id) {
      return NextResponse.json({ message: 'Site Settings ID is required for deletion' }, { status: 400 });
    }

    const settingsToDelete = await client.fetch(groq`*[_id == $_id][0]{logo, coverImage}`, { _id: id });
    if (settingsToDelete?.logo?.asset?._ref) {
      await writeClient.delete(settingsToDelete.logo.asset._ref);
      await logSanityInteraction('delete', `Deleted logo asset for site settings ${id}: ${settingsToDelete.logo.asset._ref}`, 'siteSettings', id, 'admin', true);
    }
    if (settingsToDelete?.coverImage?.asset?._ref) {
      await writeClient.delete(settingsToDelete.coverImage.asset._ref);
      await logSanityInteraction('delete', `Deleted cover image asset for site settings ${id}: ${settingsToDelete.coverImage.asset._ref}`, 'siteSettings', id, 'admin', true);
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted site settings with ID: ${id}`, 'siteSettings', id, 'admin', true);

    return NextResponse.json({ message: 'Site settings deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/siteSettings:', error);
    let errorMessage = 'Failed to delete site settings.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Now 'id' is accessible here, and we ensure it's string | undefined
    await logSanityInteraction('error', `Failed to delete site settings: ${errorMessage}`, 'siteSettings', id ?? undefined, 'admin', false, { errorDetails: errorMessage, payload: 'Site Settings ID: ' + (id || 'N/A') });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}