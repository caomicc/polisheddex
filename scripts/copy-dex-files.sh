#!/bin/bash

# Copy essential data files to public directory for production deployment
echo "Copying data files to public directory..."

# Create the output directory in public if it doesn't exist
mkdir -p public/output/manifests

# Copy dex order files
cp output/national_dex_order.json public/output/ 2>/dev/null || echo "Warning: Could not copy national_dex_order.json"
cp output/johto_dex_order.json public/output/ 2>/dev/null || echo "Warning: Could not copy johto_dex_order.json"

# Copy essential data files
cp output/pokemon_detailed_stats.json public/output/ 2>/dev/null || echo "Warning: Could not copy pokemon_detailed_stats.json"
cp output/type_chart.json public/output/ 2>/dev/null || echo "Warning: Could not copy type_chart.json"

# Copy manifest files for client-side data resolution
cp output/manifests/abilities.json public/output/manifests/ 2>/dev/null || echo "Warning: Could not copy abilities.json"
cp output/manifests/moves.json public/output/manifests/ 2>/dev/null || echo "Warning: Could not copy moves.json"
cp output/manifests/items.json public/output/manifests/ 2>/dev/null || echo "Warning: Could not copy items.json"

# Create correctly named sprite directories for problematic Pokemon
echo "Creating correctly named sprite directories..."
mkdir -p public/sprites/pokemon/mime-jr public/sprites/pokemon/mr-mime public/sprites/pokemon/mr-rime

# Copy sprites from incorrectly named directories to correctly named ones  
cp -r public/sprites/pokemon/mime_jr_/* public/sprites/pokemon/mime-jr/ 2>/dev/null || true
cp -r public/sprites/pokemon/mr__mime/* public/sprites/pokemon/mr-mime/ 2>/dev/null || true
cp -r public/sprites/pokemon/mr__rime/* public/sprites/pokemon/mr-rime/ 2>/dev/null || true

# Copy dudunsparce sprite from form directory to base directory
mkdir -p public/sprites/pokemon/dudunsparce
cp public/sprites/pokemon/dudunsparce_two_segment/front_cropped.png public/sprites/pokemon/dudunsparce/ 2>/dev/null || true

echo "Data files copied to public/output/"
