import { supabase } from './supabase';
import { Item, CreateItemInput } from '../types/items';

//
const PYTHON_API_URL = 'https://fashionclip-api-367474514447.us-central1.run.app';

/**
 * Upload an image to Supabase Storage
 * @param userId - The user's ID
 * @param uri - The local URI of the image
 * @returns The file path of the uploaded image
 */
export async function uploadItemImage(userId: string, uri: string): Promise<string> {
  try {
    // Get the file extension
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Return the file path instead of public URL
    return data.path;
  } catch (error) {
    console.error('Error in uploadItemImage:', error);
    throw error;
  }
}

/**
 * Get a signed URL for viewing a private image
 * @param imagePath - The file path in storage (e.g., 'user-uuid/image.jpg')
 * @param bucket - The storage bucket (defaults to 'item-images')
 * @returns A temporary signed URL for viewing the image
 */
export async function getSignedImageUrl(
  imagePath: string, 
  bucket: string = 'item-images' // default, so the function works normally wherever else it's implemented
): Promise<string | null> {
  try {
    if (!imagePath) {
      return null;
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(imagePath, 3600); // URL is valid for 1 hour

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;

  } catch (error) {
    console.error('Error in getSignedImageUrl:', error);
    return null;
  }
}

/**
 * Create a new item in the database
 * @param userId - The user's ID
 * @param itemData - The item data to create
 * @returns The created item
 */
export async function createItem(
  userId: string,
  itemData: CreateItemInput
): Promise<Item> {
  try {
    const signedUrl = await getSignedImageUrl(itemData.image_url);
    if (!signedUrl) {
      throw new Error('Could not get signed URL for image');
    }
    const response = await fetch(`${PYTHON_API_URL}/generate_embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...itemData, 
        image_url: signedUrl,
        storage_path: itemData.image_url,
        user_id: userId,
      }),
    });

    if (!response.ok) { //In the case the response is actually a HTML error instead
      const errorText = await response.text(); 
      console.error('API Error Status:', response.status);
      console.error('API Error Body:', errorText);
      throw new Error(`Server Error ${response.status}: ${errorText.substring(0, 100)}`);
    }
    const result = await response.json();

    if (!response.ok) {
      console.error('Error from Flask API:', result.error);
      throw new Error(result.error || 'Failed to create the item with an embedding');
    }
    return result.data[0] as Item; 

  } catch (error) {
    console.error('Error in createItem:', error);
    throw error;
  }
}

/**
 * Get all items for a user
 * @param userId - The user's ID
 * @returns Array of items
 */
export async function getUserItems(userId: string): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      throw error;
    }

    return data as Item[];
  } catch (error) {
    console.error('Error in getUserItems:', error);
    throw error;
  }
}

/**
 * Delete an item from the database
 * @param itemId - The item's ID
 */
export async function deleteItem(itemId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteItem:', error);
    throw error;
  }
}

/**
 * Update an item in the database
 * @param itemId - The item's ID
 * @param updates - The fields to update
 */
export async function updateItem(
  itemId: string,
  updates: Partial<CreateItemInput>
): Promise<Item> {
  try {
    if (updates.image_url) {
      const signedUrl = await getSignedImageUrl(updates.image_url);
      if (!signedUrl) {
        throw new Error('Could not get signed URL for new image');
      }

      const response = await fetch(`${PYTHON_API_URL}/generate_embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          image_url: signedUrl,
          item_id: itemId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Error from FashionCLIP API on update:', result.error);
        throw new Error(result.error || 'Failed to update item embedding');
      }
      return result.data[0] as Item;

    } else {
      
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating item metadata:', error);
        throw error;
      }

      return data as Item;
    }
  } catch (error) {
    console.error('Error in updateItem:', error);
    throw error;
  }
}

/**
 * Search for items similar to a query image or text
 * @param query - An object with either `queryText` or `queryImagePath`
 * @returns - Array of similar items
 */
export async function searchSimilarItems(
  userId: string,
  query: {
    queryText?: string;
    queryImagePath?: string;
  },
  categoryFilter?: string
): Promise<Item[]> {
  try {
    let queryImageUrl: string | undefined = undefined;

    if (query.queryImagePath) {
      const bucket = query.queryImagePath.includes('-temp') ? 'temp-images' : 'item-images';
      const signedUrl = await getSignedImageUrl(query.queryImagePath, bucket);
      if (!signedUrl) {
        throw new Error('Could not get signed URL for query image');
      }
      queryImageUrl = signedUrl;
    }

    const response = await fetch(`${PYTHON_API_URL}/search_similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        query_image_url: queryImageUrl,
        query_text: query.queryText,
        limit: 10,
        category: categoryFilter,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search API Error:', response.status, errorText);
      throw new Error(`Search failed: ${response.status}`);
    }
    const results = await response.json();

    const signedResults = await Promise.all(
      results.map(async (item:any) => {
        // Handle conversion from storage path to signed URL
        if(item.image_url && !item.image_url.startsWith('http')) {
          const signedURL = await getSignedImageUrl(item.image_url);
          return {...item, image_url: signedURL || item.image_url };
        }
        return item;
      })
    );
    return signedResults as Item[];

  } catch (error) {
    console.error('Error in searchSimilarItems:', error);
    throw error;
  }
}

// The below functions are specifically part of the inspiraation matching feature

/**
 * Upload a temporary image for inspiration
 * @param userId 
 * @param uri 
 */
export async function uploadTempImage(userId: string, uri: string): Promise<string> {
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-temp.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
  
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
  
      const { data, error } = await supabase.storage
        .from('temp-images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });
  
      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('Error in uploadTempImage:', error);
      throw error;
    }
  }

  /**
  * Delete a file from storage, so that we don't hold the image forever
  */
  export async function deleteFromStorage(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.error('Error cleaning up temp file:', error);
  }