# Supabase Database Setup

This document contains SQL commands to set up the required database schema for the authentication system.

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Project Settings > API
3. Create a `.env` file in the project root with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Database Schema

Run the following SQL commands in the Supabase SQL Editor (Dashboard > SQL Editor):

### 1. Create Profiles Table

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 15),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
```

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile (for account deletion)
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Policy: Allow username availability checks (public read for username only)
CREATE POLICY "Anyone can check username availability" 
  ON public.profiles 
  FOR SELECT 
  USING (true);
```

**Note:** If you already have the old "Service role can insert profiles" policy, you need to drop it first:
```sql
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
```

### 3. Create Updated At Trigger

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 4. Set Up Account Deletion Function

For proper account deletion that removes both the profile and auth user, create a database function:

```sql
-- Create a function to handle account deletion
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the user's profile
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- Delete the user from auth.users
  -- This requires the function to have SECURITY DEFINER to run with elevated privileges
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
```

**Important Security Note:** The `SECURITY DEFINER` clause allows the function to delete from `auth.users` table. Only authenticated users can call this function, and it only deletes their own account (using `auth.uid()`).

### 5. Configure Supabase Auth Settings

In your Supabase Dashboard, go to Authentication > Settings and configure:

1. **Email Auth**: Enable
2. **Email Confirmations**: Enable "Enable email confirmations"
3. **Email Templates**: Customize the confirmation email template if desired
4. **Site URL**: Set to your app's URL (for development, can be `http://localhost`)

### 6. Optional: Add Email Templates

Supabase allows you to customize email templates. Go to Authentication > Email Templates and customize:
- **Confirm signup**: This sends the OTP code to users

## Testing the Setup

After setting up the database:

1. Try signing up with a new account
2. Check that you receive an OTP email
3. Verify the OTP works
4. Check that the profile is created in the `profiles` table
5. Try logging in with the account
6. Test username availability checking during signup
7. Test profile updates and password changes
8. Test account deletion (verify user is removed from both profiles and auth.users tables)
9. Test adding items to the closet (verify items are saved in the `items` table)
10. Test image upload (verify images are stored in the `item-images` bucket)
11. Verify items are displayed only for the logged-in user

## 7. Create Items Table (for Closet Feature)

```sql
-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  color_hex TEXT,
  brand TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items(category);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items(created_at DESC);
```

### 8. Enable Row Level Security on Items Table

```sql
-- Enable RLS on items table
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own items
CREATE POLICY "Users can view own items" 
  ON public.items 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own items
CREATE POLICY "Users can insert own items"
  ON public.items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own items
CREATE POLICY "Users can update own items" 
  ON public.items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own items
CREATE POLICY "Users can delete own items"
  ON public.items
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 9. Create Updated At Trigger for Items

```sql
-- Create trigger for items table
CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 10. Set Up Storage Bucket for Item Images (Secure Configuration)

In the Supabase Dashboard, go to Storage and create a new bucket:

1. **Create Bucket**: Name it `item-images`
2. **Keep it Private**: **DO NOT** check "Public bucket" - we'll use signed URLs for security
3. **Set up Storage Policies**:

```sql
-- Policy: Users can upload their own images
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can view their own images
-- This policy checks if the user's ID matches the first folder in the file path
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'item-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Note**: Images will be organized in folders by user ID: `item-images/{user_id}/{filename}`

**Security Model**: 
- The application stores file paths (e.g., `user-uuid/image.jpg`) in the database instead of public URLs
- When displaying images, the app generates temporary signed URLs that are valid for 1 hour
- Only authenticated users can view their own images, ensuring privacy and security

## Migration: Converting Public Storage to Private Storage

If you previously set up the storage bucket as public (following older instructions), you need to migrate to the secure private storage configuration:

### Step 1: Make the Storage Bucket Private

1. Go to your Supabase project dashboard
2. Navigate to **Storage** from the sidebar
3. Find the `item-images` bucket
4. Click the options menu (three dots) next to the bucket name
5. Select **Settings**
6. **Uncheck** the "Public bucket" option
7. Save the changes

### Step 2: Update Storage Policies

Run the following SQL commands in the Supabase SQL Editor:

```sql
-- Remove the old public policy that made all images accessible to everyone
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Create a new policy that allows authenticated users to view only their own images
-- This policy checks if the user's ID matches the first folder in the file path
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'item-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### What Changed in the Application Code

The application code has been updated (in a separate commit) to:

1. **Store file paths instead of public URLs**: When uploading an image, the app now stores the file path (e.g., `user-uuid/image.jpg`) in the database instead of a public URL.

2. **Generate signed URLs on demand**: When displaying images, the app generates temporary signed URLs that are valid for 1 hour. This ensures that only authenticated users can view their own images.

3. **Handle loading states**: The app now shows a loading spinner while fetching signed URLs for images.

### Application Files That Were Modified

The following application code files were modified to support private storage (changes made in a separate code commit):

- `lib/items.ts`: Updated `uploadItemImage()` to return file path; added `getSignedImageUrl()` function
- `app/(tabs)/index.tsx`: Updated to fetch and display images using signed URLs
- `app/edit-item.tsx`: Updated to fetch and display images using signed URLs

### Testing After Migration

After running the SQL commands, test the following:

1. **Upload a new item with an image** - Verify the image is displayed correctly
2. **View existing items** - Verify all existing images are displayed with loading states
3. **Edit an item** - Verify the image is loaded and displayed correctly
4. **Try to access an image URL directly** - Verify you cannot access the image without authentication (should get a 403 error)

### Rollback Instructions

If you need to rollback these changes:

1. Revert the code changes by checking out the previous commit
2. Make the storage bucket public again in the Supabase dashboard
3. Run this SQL command to restore the old policy:

```sql
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-images');
```

⚠️ **Warning**: After rollback:
- Items uploaded under the private storage system will have file paths (e.g., `user-uuid/image.jpg`) stored in `image_url` rather than public URLs. You will need to either:
  - Regenerate public URLs for these items in your application code, OR
  - Update the `image_url` field in the database for affected items
- Items originally uploaded under the public storage system will continue to work as they already have public URLs stored.
- Switching between storage systems requires careful data migration planning to avoid broken image links.

## Troubleshooting

- **RLS Errors**: Make sure RLS policies are correctly set up
- **Email Not Received**: Check Supabase Auth settings and spam folder
- **Username Already Exists**: The app checks for username availability before signup
- **Profile Not Created**: Check if the trigger and policies are correctly set up
- **Account Deletion Issues**: Ensure the `delete_user_account()` function is created with `SECURITY DEFINER`
- **Image Upload Issues**: Make sure the `item-images` bucket is created and policies are correctly set up
- **Items Not Showing**: Verify RLS policies on items table and that items are associated with the correct user_id
- **Images Not Loading**: If using the private storage configuration, ensure signed URLs are being generated correctly

****

## Addtions Needed for "Inspiration" and "Color Planner" Features

In order to use these features, changes to the database and an API are required.

### Supabase Functions

First, in your Supabase project -> Database -> Extensions, find the "pgvectors" extension with the search bar, and enable it.


Next, in your SQL Editor, simply copy & paste, and run the following queries

- **Add Embeddings Column for Items**: Add a new column to the Items table, which will hold a vector of 512 indices (an embedding) which is a value that is generated by model that is accessed through an AI, and will be used to compare items to each other

```sql
-- Add the embeddings column
ALTER TABLE public.items
ADD COLUMN embedding vector(512); 
-- FashionCLIP produces 512-dimensional embeddings
```
- **Match_Items Function**: This function will conduct the actual operation of comparing items to each other, taking an embedding as arguement, and comparing it with all others, and is called by the API through an Supabase RPC (Remote Procedure Call), rather then the frontend

```sql
CREATE OR REPLACE FUNCTION public.match_items(
    query_embedding vector(512),
    match_threshold float,
    match_count int,
    match_user_id uuid,
    match_category text DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    user_id uuid, 
    name text,
    category text,
    color text,
    brand text,
    image_url text,
    created_at timestamptz,
    updated_at timestamptz,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        items.id,
        items.user_id, 
        items.name,
        items.category,
        items.color,
        items.brand,
        items.image_url,
        items.created_at,
        items.updated_at,
        1 - (items.embedding <=> query_embedding) AS similarity
    FROM
        public.items
    WHERE
        items.user_id = match_user_id
        AND 1 - (items.embedding <=> query_embedding) > match_threshold
        AND (match_category IS NULL OR items.category = match_category) 
    ORDER BY
        items.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_items TO authenticated;
```

**⚠️ Add `temp_images` Bucket**: In Storage -> Files, create a new bucket called `temp_images`. Do not enable the `Public Bucket` option. Enable the `Restrict File Size` option, and set the limit to 5MB. Enable the `Restrict MIME Types` option, and place these exact types:
`image/png, image/jpeg, image/jpg, image/webp, image/gif`

- **Add Policies For temp_images**: Add a new column to the Items table, which will hold a vector of 512 indices (an embedding) which is a value that is generated by model that is accessed through an AI, and will be used to compare items to each other

```sql
CREATE POLICY "Users can upload temp images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own temp images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'temp-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own temp images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'temp-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

- **Add Primary_Color Column for Items**: Finally, add the `primary_color` attribute for items, which will be used to compare their colors

```sql
-- Add a new column to hold hex
ALTER TABLE public.items 
ADD COLUMN primary_color TEXT;
```

**If it has not been done yet, setup the API by following the instructions within Capstone_API**