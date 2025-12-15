import 'react-native-url-polyfill/auto';
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
 * Uploads a local file URI to a designated PUBLIC folder in Supabase Storage 
 * and returns the permanent Public URL. It also records the file's path 
 * and expiration time in the shared_files table for later cleanup.
 * * @param localFileUri The local temporary URI of the image created in try-on.tsx.
 * @param bucketName The name of the Supabase bucket (e.g., 'item-images').
 * @param folderName The public sub-folder name (e.g., 'shared_looks').
 * @param expiresInHours The time (in hours) after which the file should be deleted (for tracking).
 * @returns The permanent public URL of the uploaded image.
 */
/*export async function uploadLocalFileToPublicStorage(
  localFileUri: string,
  bucketName: string,
  folderName: string = 'shared_looks',
  expiresInHours: number = 24
): Promise<string> {
  const userId = supabase.auth.currentUser?.id;
  if (!userId) {
    throw new Error("User must be authenticated to upload shared files.");
  }
  
  try {
    // 1. Fetch the local URI to get a Blob (this works reliably in React Native for local files)
    const response = await fetch(localFileUri);
    const blob = await response.blob();
    
    // 2. Define the storage path
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
    // NOTE: Storage policy dictates the first path segment must be 'shared_looks' for public read
    const storagePath = `${folderName}/${fileName}`; 
    
    console.log(`Uploading shared image to: ${bucketName}/${storagePath}`);

    // 3. Upload the blob to Supabase
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Failed to upload image to shared storage.');
    }

    // 4. Get the permanent public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    if (!publicUrlData) {
      throw new Error('Failed to retrieve public URL after upload.');
    }
    
    // 5. Record the file path and expiration in the database (for scheduled deletion, if enabled later)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expiresInHours);

    // NOTE: The 'shared_files' table insertion logic is here for future TTL reference.
    // If you haven't run the SQL for this table, this part will throw a warning/error, 
    // but the URL sharing should still work as we handle the error below.
    const { error: dbError } = await supabase
      .from('shared_files')
      .insert({
        file_path: storagePath,
        user_id: userId,
        expires_at: expirationDate.toISOString(),
      });

    if (dbError) {
      console.warn('Warning: Could not log file for deletion (shared_files table missing/error):', dbError);
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadLocalFileToPublicStorage:', error);
    // Add context to the error message for better debugging
    throw new Error(`Upload failed: ${error.message || 'Unknown network/file error.'}`);
  }
}*/

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

export const getItemById = async (id: string): Promise<Item | null> => {
  const { data, error } = await supabase
    .from('items') // or whatever your table name is
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching item by ID:', error);
    return null;
  }
  return data as Item;
};

/**
 * Saves a shared outfit recipe to the public shared_outfits table.
 * @param sharerId - The user's ID creating the shared link
 * @param itemIds - Object containing the top, bottom, and shoe IDs
 * @returns The unique ID of the newly shared outfit
 */
export async function createSharedOutfit(
  sharerId: string,
  itemIds: { topId?: string | null; bottomId?: string | null; shoeId?: string | null }
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('shared_outfits')
      .insert({
        sharer_id: sharerId,
        top_id: itemIds.topId || null,
        bottom_id: itemIds.bottomId || null,
        shoe_id: itemIds.shoeId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating shared outfit:', error);
      throw error;
    }

    return data.id as string;
  } catch (error) {
    console.error('Error in createSharedOutfit:', error);
    throw error;
  }
}

/**
 * Fetches the recipe for a single shared outfit by its unique ID.
 * @param outfitId - The unique ID of the shared outfit
 * @returns The shared outfit recipe object or null if not found.
 */
export async function getSharedOutfitById(outfitId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('shared_outfits')
      .select('top_id, bottom_id, shoe_id, sharer_id')
      .eq('id', outfitId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore '0 rows' error
      console.error('Error fetching shared outfit recipe:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSharedOutfitById:', error);
    return null;
  }
}
