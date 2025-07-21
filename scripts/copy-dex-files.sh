#!/bin/bash

# Copy dex order files to public directory for production deployment
echo "Copying dex order files to public directory..."

# Create the output directory in public if it doesn't exist
mkdir -p public/output

# Copy the files
cp output/national_dex_order.json public/output/ 2>/dev/null || echo "Warning: Could not copy national_dex_order.json"
cp output/johto_dex_order.json public/output/ 2>/dev/null || echo "Warning: Could not copy johto_dex_order.json"

echo "Dex order files copied to public/output/"
