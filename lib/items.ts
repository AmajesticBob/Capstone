import { supabase } from './supabase';
import { Item, CreateItemInput } from '../types/items';

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
 * @returns A temporary signed URL for viewing the image
 */
export async function getSignedImageUrl(imagePath: string): Promise<string | null> {
  try {
    if (!imagePath) {
      return null;
    }

    const { data, error } = await supabase.storage
      .from('item-images')
      .createSignedUrl(imagePath, 3600); // URL valid for 1 hour

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
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          user_id: userId,
          ...itemData,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      throw error;
    }

    return data as Item;
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
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }

    return data as Item;
  } catch (error) {
    console.error('Error in updateItem:', error);
    throw error;
  }
}
