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

echo "Data files copied to public/output/"
