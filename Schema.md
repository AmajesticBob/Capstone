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
