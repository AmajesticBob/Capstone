# Outfit Planner - React Native App

A React Native mobile application for managing your wardrobe, planning outfits, and getting style inspiration with secure user authentication.

## Features

- **User Authentication**: Secure sign-up and login with email verification
- **My Closet**: Browse and manage your clothing items
- **Planner**: Get smart color suggestions based on selected items
- **Virtual Try-On**: Preview outfit combinations
- **Inspiration**: Upload photos for outfit ideas
- **Profile**: Manage account settings and preferences, including dark mode

## Tech Stack

- React Native with Expo
- **Expo Router** with file-based routing
- **Supabase** for authentication and backend
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
│   └── supabase.ts          # Supabase client setup
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

See `SUPABASE_SETUP.md` for complete setup instructions.

## Key Features

### Authentication Flow
1. User signs up with username, email, and password
2. System validates username availability in real-time
3. Email with OTP is sent for verification
4. User enters OTP to complete registration
5. Profile is created in database
6. User can now log in and access the app

### Security Features
- Password hashing and salting handled by Supabase Auth
- Row Level Security (RLS) policies on database
- Unique constraints on username and email
- Session management with secure storage
- Protected routes requiring authentication

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
- Make sure Supabase is properly configured (see `Schema.md`)
- Check that environment variables are set correctly in `.env`
- Verify email confirmation is enabled in Supabase Auth settings
- Make sure you've run all SQL commands in `Schema.md`

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Clear Expo cache: `npx expo start -c`
- Make sure you have the latest version of Expo CLI

### Database Issues
- Run the SQL commands in `SUPABASE_SETUP.md` in order
- Check Row Level Security policies are properly set
- Verify the `profiles` table exists and has the correct schema
- Ensure Supabase Auth email confirmations are enabled

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

