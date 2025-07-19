# Items Route Documentation

## Overview
The items route provides a comprehensive interface for browsing and viewing item data from Pokémon Polished Crystal.

## File Structure
```
src/app/items/
├── page.tsx                 # Items listing page
├── [name]/
│   ├── page.tsx            # Individual item detail page
│   └── not-found.tsx       # 404 page for invalid items

src/components/items/
└── ItemSearch.tsx          # Client-side search and filtering

src/types/types.ts          # Item type definitions
```

## Features

### Items Listing Page (`/items`)
- **Sorting Options**: Alphabetical, Price (Low to High), Price (High to Low), Category
- **Category Filtering**: Filter by item categories (Poké Ball, Medicine, TM, etc.)
- **Item Cards**: Display item name, category, description, price, and location count
- **Responsive Design**: Grid layout that adapts to screen size
- **Search Statistics**: Shows total number of items found

### Individual Item Page (`/items/[name]`)
- **Detailed Information**: Complete item details including description, price, and usage
- **Location Data**: Organized by acquisition method (For sale, Found, etc.)
- **Static Generation**: Pre-built pages for all items for optimal performance
- **SEO Optimized**: Dynamic metadata for each item

### Components

#### ItemSearch
- Client-side component for filtering and sorting
- Updates URL parameters for shareable links
- Maintains state between page refreshes

## Data Structure
Items data is loaded from `output/items_data.json` with two different structures:

### Regular Items
```typescript
interface ItemData {
  id: string;
  name: string;
  description: string;
  attributes: {
    price: number;
    effect: string;
    parameter: number;
    category: string;
    useOutsideBattle: string;
    useInBattle: string;
  };
  locations?: Array<{
    area: string;
    details: string;
  }>;
}
```

### TM/HM Items
```typescript
interface TMHMData {
  id: string;
  name: string;
  description: string;
  type: string;
  move: string;
  location?: {
    area: string;
    details: string;
  };
}
```

**Note**: The application includes robust null checking to handle items with missing `locations` arrays or `attributes` objects.

## Navigation
The items route is integrated into the main navigation alongside Pokedex and Locations.

## Performance
- Static generation for all item pages
- Optimized with Next.js App Router
- Responsive images and lazy loading
- Efficient client-side filtering

## Integration with Other Routes
The items route is seamlessly integrated with other parts of the application:

### Location Pages
- **Rare Items Column**: In location detail pages (`/locations/[name]`), the "Rare Item" column now links to the corresponding item detail page
- **Smart Item Linking**: Uses a utility function to convert item display names to item IDs for proper linking

### Pokemon Pages  
- **Held Items in Location Tables**: In Pokemon detail pages, the "Held Item" column in location tables links to item detail pages
- **Automatic Link Detection**: Items are automatically detected and linked when they exist in the items database

### Item ID Conversion
The application includes a robust utility function (`getItemIdFromDisplayName`) that:
- Converts display names like "Leaf Stone" to item IDs like "leafstone"
- Handles special cases for Poké Balls, evolution stones, and other items
- Gracefully falls back to display-only text for items not found in the database
