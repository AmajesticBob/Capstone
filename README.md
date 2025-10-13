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
- React Navigation (Bottom Tabs & Stack)
- Expo Vector Icons
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
├── App.js                    # Main app component with navigation
├── index.js                  # Entry point
├── theme.js                  # Color theme configuration
├── ThemeContext.js           # Dark mode context provider
└── screens/
    ├── ClosetScreen.js       # Closet management screen
    ├── PlannerScreen.js      # Color planning screen
    ├── TryOnScreen.js        # Virtual try-on screen
    ├── InspirationScreen.js  # Inspiration and upload screen
    ├── ProfileScreen.js      # User profile and settings
    └── AddItemScreen.js      # Add new item modal

```

## Original HTML Version

The original web version is available in `index.html` and uses:
- Vanilla JavaScript
- Tailwind CSS
- Material Icons
- Progressive Web App features

## Conversion Notes

This React Native version maintains the same functionality and UI/UX as the original HTML version while adapting it for native mobile platforms with:
- Native navigation patterns
- Touch-optimized interactions
- Platform-specific components
- Dark mode support using system preferences