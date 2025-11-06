# Outfit Planner - React Native App

A React Native mobile application for managing your wardrobe, planning outfits, and getting style inspiration with secure user authentication.

## Features

- **User Authentication**: Secure sign-up and login with email verification
- **My Closet**: Browse and manage your clothing items with photo uploads
  - Add items with photos from camera or gallery
  - Categorize items (Tops, Bottoms, Shoes)
  - Filter items by category with tab navigation
  - Edit items by tapping on them
  - Delete items with confirmation
  - Add color and brand information
  - View items in a responsive grid with image previews
  - Pull-to-refresh to sync latest items
- **Planner**: Get smart color suggestions based on selected items
- **Virtual Try-On**: Preview outfit combinations
- **Inspiration**: Upload photos for outfit ideas
- **Profile**: Manage account settings and preferences, including dark mode

## Tech Stack

- React Native with Expo
- **Expo Router** with file-based routing
- **Supabase** for authentication, database, and storage
- **Expo Image Picker** for photo uploads
- **Native Tabs** with iOS liquid glass blur effect
- Expo Vector Icons
- TypeScript
- Context API for theme and auth management
- Dark mode support

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a Supabase project at https://supabase.com
   - Follow the instructions in `SUPABASE_SETUP.md` to set up the database schema
   - Create a `.env` file in the project root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
- Install the Expo Go app on your iOS or Android device
- Scan the QR code from the terminal

Or run on emulator:
```bash
npm run android  # For Android
npm run ios      # For iOS
```

## Authentication Features

### Sign Up
- Username validation (3-15 characters, letters, numbers, underscore)
- Real-time username availability checking
- Email format validation
- Password strength indicator
- Email verification via OTP (One-Time Password)

### Login
- Secure email and password authentication
- Session persistence
- Protected routes

### Profile Management
- View user profile with username and email
- Edit profile (username)
- Change password securely
- Logout functionality

## Project Structure

```
├── app/                      # Expo Router app directory
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx        # Login screen
│   │   ├── signup.tsx       # Sign-up with validation
│   │   └── verify-otp.tsx   # OTP verification
│   ├── (tabs)/              # Tab-based navigation group
│   │   ├── _layout.tsx      # Native tabs layout with iOS blur
│   │   ├── index.tsx        # Closet screen (default tab)
│   │   ├── planner.tsx      # Color planning screen
│   │   ├── try-on.tsx       # Virtual try-on screen
│   │   ├── inspiration.tsx  # Inspiration and upload screen
│   │   └── profile.tsx      # User profile and settings
│   ├── (profile)/           # Profile management screens
│   │   ├── edit-profile.tsx # Edit user profile
│   │   └── change-password.tsx # Change password
│   ├── _layout.tsx          # Root layout with auth provider
│   ├── index.tsx            # Auth state router
│   └── add-item.tsx         # Add new item modal
├── contexts/                 # React contexts
│   └── AuthContext.tsx      # Authentication context
├── lib/                      # Library configurations
│   ├── supabase.ts          # Supabase client setup
│   └── items.ts             # Item CRUD operations
├── types/                    # TypeScript type definitions
│   └── items.ts             # Item-related types
├── theme.js                  # Color theme configuration
├── ThemeContext.js           # Dark mode context provider
├── SUPABASE_SETUP.md        # Database setup instructions
├── .env.example             # Environment variables template
└── tsconfig.json            # TypeScript configuration
```

## Database Schema

The app uses Supabase with the following schema:

### Profiles Table
- `id` (UUID, primary key, references auth.users)
- `username` (TEXT, unique, 3-15 characters)
- `email` (TEXT, unique)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Items Table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `name` (TEXT, required)
- `category` (TEXT, required)
- `color` (TEXT, optional)
- `brand` (TEXT, optional)
- `image_url` (TEXT, optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Storage Buckets
- `item-images`: Public bucket for storing item photos organized by user ID

See `SUPABASE_SETUP.md` for complete setup instructions.

## Key Features

### Authentication Flow
1. User signs up with username, email, and password
2. System validates username availability in real-time
3. Email with OTP is sent for verification
4. User enters OTP to complete registration
5. Profile is created in database
6. User can now log in and access the app

### Closet/Items Flow
1. User logs in and navigates to My Closet tab
2. User can filter items by category (All, Tops, Bottoms, Shoes)
3. User taps "Add Item" button to add new items
4. User selects or takes a photo of the clothing item
5. User fills in item details (name, category, color, brand)
6. Photo is uploaded to Supabase Storage
7. Item data is saved to database with user_id
8. User is redirected back to closet
9. Item appears in the closet grid with image preview
10. User can tap any item to edit its details or delete it
11. Items are automatically synced and unique to each user account

### Security Features
- Password hashing and salting handled by Supabase Auth
- Row Level Security (RLS) policies on database
- Users can only view and modify their own items
- Unique constraints on username and email
- Session management with secure storage
- Protected routes requiring authentication
- Image uploads organized by user ID in storage

### iOS Liquid Glass Effect
The tab bar uses native iOS blur effects:
- Light mode: `systemMaterialLight` 
- Dark mode: `systemMaterialDark`
- Provides translucent, frosted glass appearance on iOS
- Falls back to solid colors on Android

### File-Based Routing
Uses Expo Router's file-based routing system:
- Routes are automatically generated from the `app/` directory structure
- Groups routes using `(auth)`, `(tabs)`, and `(profile)` directories
- Type-safe navigation with `useRouter()` hook

## Environment Variables

Required environment variables (create a `.env` file):

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

See `.env.example` for reference.

## Troubleshooting

### Authentication Issues
- Make sure Supabase is properly configured (see `SUPABASE_SETUP.md`)
- Check that environment variables are set correctly in `.env`
- Verify email confirmation is enabled in Supabase Auth settings
- Make sure you've run all SQL commands in `SUPABASE_SETUP.md`

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Clear Expo cache: `npx expo start -c`
- Make sure you have the latest version of Expo CLI

### Database Issues
- Run the SQL commands in `SUPABASE_SETUP.md` in order
- Check Row Level Security policies are properly set
- Verify the `profiles` table exists and has the correct schema
- Verify the `items` table exists and has the correct schema
- Ensure Supabase Auth email confirmations are enabled
- Make sure the `item-images` storage bucket is created and set to public

### Items/Closet Issues
- If items aren't showing, check that RLS policies are correctly set on the `items` table
- Verify that items are being saved with the correct `user_id`
- Check that the `item-images` storage bucket exists in Supabase
- Ensure storage policies allow authenticated users to upload
- If image upload fails, verify device permissions for camera/photo library
- Try pull-to-refresh to sync latest items from the database

### Username Availability
- The app checks username availability in real-time (debounced at 500ms)
- Usernames must be 3-15 characters (letters, numbers, underscore only)
- If a username is taken, try a different one

### OTP Not Received
- Check your spam folder
- Verify email settings in Supabase Dashboard > Authentication > Settings
- Try resending the OTP code
- Make sure the email address is valid

## Original HTML Version

The original web version is available in `wireframe.html` and uses:
- Vanilla JavaScript
- Tailwind CSS
- Material Icons
- Progressive Web App features

## License

This project is private.
