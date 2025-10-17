# Outfit Planner - React Native App

A React Native mobile application for managing your wardrobe, planning outfits, and getting style inspiration.

## Features

- **My Closet**: Browse and manage your clothing items with filtering by category (Tops, Bottoms, Shoes)
- **Planner**: Get smart color suggestions based on selected items
- **Virtual Try-On**: Preview outfit combinations with AI-generated looks
- **Inspiration**: Upload photos for outfit ideas and view inspired looks
- **Profile**: Manage account settings and preferences, including dark mode

## Tech Stack

- React Native with Expo
- **Expo Router** with file-based routing
- **Native Tabs** with iOS liquid glass blur effect
- Expo Vector Icons
- TypeScript
- Context API for theme management
- Dark mode support

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Install the Expo Go app on your iOS or Android device
- Scan the QR code from the terminal

Or run on emulator:
```bash
npm run android  # For Android
npm run ios      # For iOS
```

## Project Structure

```
├── app/                      # Expo Router app directory
│   ├── (tabs)/              # Tab-based navigation group
│   │   ├── _layout.tsx      # Native tabs layout with iOS blur
│   │   ├── index.tsx        # Closet screen (default tab)
│   │   ├── planner.tsx      # Color planning screen
│   │   ├── try-on.tsx       # Virtual try-on screen
│   │   ├── inspiration.tsx  # Inspiration and upload screen
│   │   └── profile.tsx      # User profile and settings
│   ├── _layout.tsx          # Root layout
│   └── add-item.tsx         # Add new item modal
├── theme.js                  # Color theme configuration
├── ThemeContext.js           # Dark mode context provider
├── app.json                  # Expo configuration with router plugin
└── tsconfig.json             # TypeScript configuration

```

## Original HTML Version

The original web version is available in `index.html` and uses:
- Vanilla JavaScript
- Tailwind CSS
- Material Icons
- Progressive Web App features

## Conversion Notes

This React Native version maintains the same functionality and UI/UX as the original HTML version while adapting it for native mobile platforms with:
- **Expo Router** for file-based routing
- **Native Tabs** with iOS liquid glass blur effect (`systemMaterialLight`/`systemMaterialDark`)
- Type-safe navigation with TypeScript
- Touch-optimized interactions
- Platform-specific components
- Dark mode support using system preferences

## Key Features

### iOS Liquid Glass Effect
The tab bar uses native iOS blur effects:
- Light mode: `systemMaterialLight` 
- Dark mode: `systemMaterialDark`
- Provides translucent, frosted glass appearance on iOS
- Falls back to solid colors on Android

### File-Based Routing
Uses Expo Router's file-based routing system:
- Routes are automatically generated from the `app/` directory structure
- Groups routes using `(tabs)` directory
- Type-safe navigation with `useRouter()` hook