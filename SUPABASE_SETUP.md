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
  brand TEXT,
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

### 10. Set Up Storage Bucket for Item Images

In the Supabase Dashboard, go to Storage and create a new bucket:

1. **Create Bucket**: Name it `item-images`
2. **Make it Public**: Check "Public bucket" so images can be accessed via URL
3. **Set up Storage Policies**:

```sql
-- Policy: Users can upload their own images
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Anyone can view images
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-images');

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

Images will be organized in folders by user ID: `item-images/{user_id}/{filename}`

