# System Architecture - Add Item Feature

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐              ┌─────────────────────────┐      │
│  │   My Closet Screen   │              │  Add Item Screen        │      │
│  │  (app/(tabs)/index)  │◄─────────────┤  (app/add-item.tsx)     │      │
│  │                      │   Navigate   │                         │      │
│  │  • Grid Display      │     Back     │  • Image Picker         │      │
│  │  • Item Cards        │              │  • Form Validation      │      │
│  │  • Pull-to-Refresh   │              │  • Category Selection   │      │
│  │  • Empty State       │              │  • Loading States       │      │
│  │  • Add Button        │              │  • Error Handling       │      │
│  └──────────────────────┘              └─────────────────────────┘      │
│           │                                       │                       │
└───────────┼───────────────────────────────────────┼───────────────────────┘
            │                                       │
            │ getUserItems()                        │ uploadItemImage()
            │ (fetch items)                         │ createItem()
            ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    lib/items.ts                                 │     │
│  │                                                                  │     │
│  │  • uploadItemImage(userId, uri) → Promise<string>              │     │
│  │  • createItem(userId, itemData) → Promise<Item>                │     │
│  │  • getUserItems(userId) → Promise<Item[]>                      │     │
│  │  • updateItem(itemId, updates) → Promise<Item>                 │     │
│  │  • deleteItem(itemId) → Promise<void>                          │     │
│  │                                                                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    types/items.ts                               │     │
│  │                                                                  │     │
│  │  • interface Item                                               │     │
│  │  • interface CreateItemInput                                    │     │
│  │                                                                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└───────────────────────────┬───────────────────────────┬─────────────────┘
                            │                           │
                   Image Upload                   Data Operations
                            │                           │
                            ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE BACKEND                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐              ┌─────────────────────────┐      │
│  │  Supabase Storage    │              │  Supabase Database      │      │
│  │  (item-images)       │              │  (PostgreSQL)           │      │
│  │                      │              │                         │      │
│  │  Folder Structure:   │              │  ┌──────────────────┐   │      │
│  │  ├─ {userId}/        │              │  │  profiles table  │   │      │
│  │  │  ├─ 1234.jpg      │              │  │  - id            │   │      │
│  │  │  ├─ 5678.jpg      │              │  │  - username      │   │      │
│  │  │  └─ 9012.png      │              │  │  - email         │   │      │
│  │                      │              │  └──────────────────┘   │      │
│  │  Access: Public      │              │                         │      │
│  │  Upload: Auth Only   │              │  ┌──────────────────┐   │      │
│  │                      │              │  │  items table     │   │      │
│  │                      │              │  │  - id            │   │      │
│  │                      │              │  │  - user_id  FK   │   │      │
│  │                      │              │  │  - name          │   │      │
│  │                      │              │  │  - category      │   │      │
│  │                      │              │  │  - color         │   │      │
│  │                      │              │  │  - brand         │   │      │
│  │                      │              │  │  - image_url     │   │      │
│  │                      │              │  │  - created_at    │   │      │
│  │                      │              │  │  - updated_at    │   │      │
│  │                      │              │  └──────────────────┘   │      │
│  │                      │              │                         │      │
│  │                      │              │  RLS Policies:          │      │
│  │                      │              │  ✓ Users see own items  │      │
│  │                      │              │  ✓ Users insert own     │      │
│  │                      │              │  ✓ Users update own     │      │
│  │                      │              │  ✓ Users delete own     │      │
│  └──────────────────────┘              └─────────────────────────┘      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         USER FLOW DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────┘

                              START
                                │
                                ▼
                        ┌───────────────┐
                        │  User Logged  │
                        │      In       │
                        └───────┬───────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Opens "My Closet"    │
                    │       Tab             │
                    └───────┬───────────────┘
                            │
                            ▼
                    ┌───────────────────────┐
                    │  Has Items?           │
                    └───┬───────────┬───────┘
                        │           │
                    No  │           │  Yes
                        │           │
                        ▼           ▼
            ┌───────────────┐   ┌──────────────────┐
            │ Empty State   │   │  Show Grid of    │
            │ "Add Item"    │   │  Item Cards      │
            │  Button       │   │  with Images     │
            └───────┬───────┘   └────┬────────┬────┘
                    │                │        │
                    │ Click Add      │        │ Pull Down
                    │                │ Click + │
                    └────────┬───────┘        │
                             │                │ Refresh
                             ▼                ▼
                    ┌────────────────────────────┐
                    │  Add Item Screen           │
                    └────────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  Tap Photo Upload Area     │
                    └────────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  Action Sheet:             │
                    │  • Take Photo              │
                    │  • Choose from Library     │
                    │  • Cancel                  │
                    └────┬──────────────┬────────┘
                         │              │
              Take Photo │              │ Choose Library
                         ▼              ▼
                 ┌──────────────────────────┐
                 │  Image Picker            │
                 │  (Camera/Gallery)        │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │  Image Preview           │
                 │  in Form                 │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │  Fill Form:              │
                 │  • Name (required)       │
                 │  • Category (required)   │
                 │  • Color (optional)      │
                 │  • Brand (optional)      │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │  Tap "Save Item"         │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │  Validation Check        │
                 └────┬──────────────┬──────┘
                      │              │
                Valid │              │ Invalid
                      │              │
                      ▼              ▼
         ┌─────────────────┐   ┌──────────────┐
         │ Upload Image    │   │ Show Error   │
         │ to Storage      │   │ Alert        │
         └────────┬────────┘   └──────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Save Item to    │
         │ Database        │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Success Alert   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Navigate Back   │
         │ to Closet       │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Item Appears    │
         │ in Grid         │
         └─────────────────┘
                  │
                  ▼
                 END


┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA ISOLATION MODEL                                │
└─────────────────────────────────────────────────────────────────────────┘

    User A (user_id: uuid-a)              User B (user_id: uuid-b)
           │                                      │
           ▼                                      ▼
    ┌──────────────┐                      ┌──────────────┐
    │   Items:     │                      │   Items:     │
    │   • Blue     │                      │   • Red      │
    │     Jeans    │                      │     Shirt    │
    │   • Black    │                      │   • White    │
    │     Shoes    │                      │     Sneakers │
    └──────────────┘                      └──────────────┘
           │                                      │
           └──────────┬──────────────────────────┘
                      ▼
            ┌──────────────────────┐
            │  Supabase Database   │
            │  with RLS Policies   │
            └──────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼              ▼
   User A Items  User B Items   User C Items
     (isolated)    (isolated)     (isolated)

   RLS Policy: WHERE user_id = auth.uid()
   Result: Each user ONLY sees their own items


┌─────────────────────────────────────────────────────────────────────────┐
│                   TECHNOLOGY STACK                                       │
└─────────────────────────────────────────────────────────────────────────┘

Frontend:
  • React Native (0.81.4)
  • Expo (~54.0.0)
  • Expo Router (^6.0.12)
  • TypeScript (^5.9.3)
  • expo-image-picker (^15.0.7)

Backend:
  • Supabase (PostgreSQL + Storage + Auth)
  • Row Level Security (RLS)
  • Supabase JS Client (^2.76.1)

State Management:
  • React Context (AuthContext)
  • React Hooks (useState, useEffect, useCallback)
  • Expo Router (useFocusEffect)

Security:
  • CodeQL (0 vulnerabilities)
  • RLS Policies
  • JWT Authentication
  • Secure Storage


┌─────────────────────────────────────────────────────────────────────────┐
│                      FILE STRUCTURE                                      │
└─────────────────────────────────────────────────────────────────────────┘

liquid/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx ..................... Closet display (248 lines)
│   └── add-item.tsx ...................... Add item form (484 lines)
├── lib/
│   └── items.ts ......................... CRUD operations (154 lines)
├── types/
│   └── items.ts ......................... TypeScript types (19 lines)
├── contexts/
│   └── AuthContext.tsx .................. User authentication
├── SUPABASE_SETUP.md .................... Database schema (+104 lines)
├── TESTING_ADD_ITEM.md .................. Testing guide (249 lines)
├── ADD_ITEM_REFERENCE.md ................ Quick reference (264 lines)
└── README.md ............................ Updated docs (+49 lines)

Total: 924 lines added, 28 lines removed
