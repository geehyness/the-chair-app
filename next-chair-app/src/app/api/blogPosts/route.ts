// src/app/api/blogPosts/route.ts
import { writeClient, client } from "@/lib/sanity";
import { logSanityInteraction } from "@/lib/sanityLogger";
import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";

export const dynamic = 'force-dynamic';

// Helper to upload image and return asset ID
async function uploadImageToSanity(imageFile: File | string | null): Promise<string | undefined> {
  if (!imageFile) return undefined;

  if (typeof imageFile === 'string') {
    if (imageFile.startsWith('blob:') || imageFile.startsWith('data:')) {
      try {
        // Fetch the blob/data URL to get a Blob object
        const response = await fetch(imageFile);
        const blob = await response.blob();
        const uploadedAsset = await writeClient.assets.upload('image', blob);
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
    const publishedAt = formData.get('publishedAt')?.toString();
    const excerpt = formData.get('excerpt')?.toString();
    const content = formData.get('content')?.toString(); // Portable Text as JSON string
    const author = formData.get('author')?.toString();
    const tagsJson = formData.get('tags')?.toString(); // Expect JSON string for array
    const coverImageFile = formData.get('coverImage') as File | null;

    if (!title || !slug) {
      return NextResponse.json({ message: 'Missing required fields (title, slug)' }, { status: 400 });
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

    let coverImageAssetRefId: string | undefined = undefined;
    if (coverImageFile) {
      coverImageAssetRefId = await uploadImageToSanity(coverImageFile);
    }

    const blogPostDoc: any = { // Consider defining a more specific type than 'any'
      _type: 'blogPost',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      publishedAt: publishedAt || new Date().toISOString(),
      excerpt,
      author,
      tags,
    };

    if (content) {
      try {
        blogPostDoc.content = JSON.parse(content);
      } catch (e) {
        console.error("Error parsing content JSON:", e);
        return NextResponse.json({ message: 'Invalid content format.' }, { status: 400 });
      }
    }

    if (coverImageAssetRefId) {
      blogPostDoc.coverImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: coverImageAssetRefId,
        },
      };
    }

    const newBlogPost = await writeClient.create(blogPostDoc);
    await logSanityInteraction('create', `Created new blog post: ${title}`, 'blogPost', newBlogPost._id, 'admin', true, { payload: blogPostDoc });

    return NextResponse.json(newBlogPost, { status: 201 });
  } catch (error: any) { // Consider defining a more specific type than 'any'
    console.error('Error in POST /api/blogPosts:', error);
    let errorMessage = 'Failed to create blog post.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    await logSanityInteraction('error', `Failed to create blog post: ${errorMessage}`, 'blogPost', undefined, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  let id: string | null = null; // <--- Declared outside try block
  try {
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id');
    const slug = searchParams.get('slug');

    let query = groq`*[_type == "blogPost"]{
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      "coverImageUrl": coverImage.asset->url,
      author,
      tags,
      content // Fetch content for single post view
    }`;

    if (id) {
      query = groq`*[_type == "blogPost" && _id == "${id}"][0]{
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        "coverImageUrl": coverImage.asset->url,
        author,
        tags,
        content
      }`;
    } else if (slug) {
      query = groq`*[_type == "blogPost" && slug.current == "${slug}"][0]{
        _id,
        title,
        slug,
        publishedAt,
        excerpt,
        "coverImageUrl": coverImage.asset->url,
        author,
        tags,
        content
      }`;
    }

    const blogPosts = await client.fetch(query);
    // Convert 'id' from string | null to string | undefined for logSanityInteraction
    const documentIdForLog = id !== null ? id : undefined;
    await logSanityInteraction('fetch', `Fetched blog post(s) with ID: ${id || 'all'}`, 'blogPost', documentIdForLog, 'system', true, { query });

    return NextResponse.json(blogPosts, { status: 200 });
  } catch (error: any) { // Consider defining a more specific type than 'any'
    console.error('Error in GET /api/blogPosts:', error);
    let errorMessage = 'Failed to fetch blog posts.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Convert 'id' from string | null to string | undefined for logSanityInteraction in catch block
    const documentIdForLogError = id !== null ? id : undefined;
    await logSanityInteraction('error', `Failed to fetch blog posts: ${errorMessage}`, 'blogPost', documentIdForLogError, 'system', false, { errorDetails: errorMessage }); // <--- FIXED HERE
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let _id: string | null = null; // <--- Declared outside try block
  try {
    const { searchParams } = new URL(req.url);
    _id = searchParams.get('id');

    if (!_id) {
      return NextResponse.json({ message: 'Blog Post ID is required for update' }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString();
    const slug = formData.get('slug')?.toString();
    const publishedAt = formData.get('publishedAt')?.toString();
    const excerpt = formData.get('excerpt')?.toString();
    const content = formData.get('content')?.toString();
    const author = formData.get('author')?.toString();
    const tagsJson = formData.get('tags')?.toString();
    const coverImageFile = formData.get('coverImage') as File | string | null; // Can be File or 'null' string

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

    const currentBlogPost = await client.fetch(groq`*[_id == $_id][0]{coverImage}`, { _id });
    const oldCoverImageAssetRef = currentBlogPost?.coverImage?.asset?._ref;

    const patch = writeClient.patch(_id);
    const updates: any = {}; // Consider defining a more specific type than 'any'

    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = { _type: 'slug', current: slug };
    if (publishedAt !== undefined) updates.publishedAt = publishedAt;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (author !== undefined) updates.author = author;
    if (tagsJson !== undefined) updates.tags = tags;

    if (content !== undefined) {
      try {
        updates.content = JSON.parse(content);
      } catch (e) {
        console.error("Error parsing content JSON for update:", e);
        return NextResponse.json({ message: 'Invalid content format for update.' }, { status: 400 });
      }
    }

    let newCoverImageAssetRef: string | undefined = undefined;
    if (coverImageFile instanceof File) {
      newCoverImageAssetRef = await uploadImageToSanity(coverImageFile);
      updates.coverImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: newCoverImageAssetRef,
        },
      };
    } else if (coverImageFile === 'null') {
      updates.coverImage = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    const updatedBlogPost = await patch.set(updates).commit();
    // Convert '_id' from string | null to string | undefined for logSanityInteraction
    const documentIdForLogPut = _id !== null ? _id : undefined;
    await logSanityInteraction('update', `Updated blog post: ${title || _id}`, 'blogPost', documentIdForLogPut, 'admin', true, { payload: updates });

    if (oldCoverImageAssetRef && (coverImageFile instanceof File || coverImageFile === 'null')) {
      try {
        await writeClient.delete(oldCoverImageAssetRef);
        await logSanityInteraction('delete', `Deleted old blog post cover image asset: ${oldCoverImageAssetRef}`, 'blogPost', documentIdForLogPut, 'admin', true);
      } catch (deleteError) {
        console.warn(`Could not delete old Sanity asset ${oldCoverImageAssetRef}:`, deleteError);
      }
    }

    return NextResponse.json(updatedBlogPost, { status: 200 });
  } catch (error: any) { // Consider defining a more specific type than 'any'
    console.error('Error in PUT /api/blogPosts:', error);
    let errorMessage = 'Failed to update blog post.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Convert '_id' from string | null to string | undefined for logSanityInteraction
    const documentIdForLogErrorPut = _id !== null ? _id : undefined;
    await logSanityInteraction('error', `Failed to update blog post: ${errorMessage}`, 'blogPost', documentIdForLogErrorPut, 'admin', false, { errorDetails: errorMessage, payload: 'FormData received' });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let id: string | null = null; // <--- Declared outside try block
  try {
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Blog Post ID is required for deletion' }, { status: 400 });
    }

    const blogPostToDelete = await client.fetch(groq`*[_id == $_id][0]{coverImage}`, { _id: id });
    if (blogPostToDelete?.coverImage?.asset?._ref) {
      await writeClient.delete(blogPostToDelete.coverImage.asset._ref);
      await logSanityInteraction('delete', `Deleted cover image asset for blog post ${id}: ${blogPostToDelete.coverImage.asset._ref}`, 'blogPost', id, 'admin', true);
    }

    await writeClient.delete(id);
    await logSanityInteraction('delete', `Deleted blog post with ID: ${id}`, 'blogPost', id, 'admin', true);

    return NextResponse.json({ message: 'Blog post deleted successfully' }, { status: 200 });
  } catch (error: any) { // Consider defining a more specific type than 'any'
    console.error('Error in DELETE /api/blogPosts:', error);
    let errorMessage = 'Failed to delete blog post.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as any).message;
    }
    // Convert 'id' from string | null to string | undefined for logSanityInteraction
    const documentIdForLogErrorDelete = id !== null ? id : undefined;
    await logSanityInteraction('error', `Failed to delete blog post: ${errorMessage}`, 'blogPost', documentIdForLogErrorDelete, 'admin', false, { errorDetails: errorMessage, payload: 'Blog Post ID: ' + id }); // <--- FIXED HERE
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
